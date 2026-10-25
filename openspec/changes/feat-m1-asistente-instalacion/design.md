# Design

## Context

`AltaPrimerUsuario` y `ConfiguracionInstalacion` vienen de `feat-m2-modo-autoalojado`; el código lo imprime `instalar.sh` (`feat-instalador-autoalojado`). Desde el contrato `instalacion.md` v1.6–1.8 ya existen: las columnas `smtp*` y `sinCorreo`, `RepositorioConfiguracionInstalacion.correo()` / `guardarCorreo()` y `CifradorVariables` exportado por `VariablesModule`.

## Decisions

### 1. Código de un solo uso

Se guarda solo su hash y su vencimiento; al crear el administrador se borra (`AltaPrimerUsuario.consumirCodigo`). Evita que otro reclame la cuenta en un servidor recién expuesto. `POST /instalacion/administrador` recibe `{ codigo, correo, contrasena }` y vuelve a llamar a `validarCodigo` antes de crear la cuenta (contrato v1.8): sin eso, el endpoint abierto permite saltarse el paso 1. La web guarda el código solo en memoria entre el paso 1 y el 2.

### 2. La sesión queda iniciada al crear el administrador

`POST /instalacion/administrador` crea la cuenta con rol Administrador y `estadoCuenta = activa` (verificada), consume el código y llama a `SesionService.iniciar({ correo, contrasena, agenteUsuario })`. Pone la cookie con `cookieSesion` y el `ConfiguracionCookie` inyectado, como `SesionController`. Así no se reescribe la creación de sesiones. Después del paso 2 el código ya no sirve: la sesión es lo único que prueba que es quien instaló. Pedir el login a mitad del asistente no da más seguridad.

### 3. Quién puede llamar a qué

| Endpoint | Sin administrador | Con administrador |
|---|---|---|
| `POST /instalacion/codigo`, `/administrador` | abiertos | 404 |
| `POST /instalacion/correo/prueba`, `PATCH /instalacion/correo` | 401 | `SesionGuard` + `RolGuard("administrador")` |

En modo `nube`, todo da 404 (`SoloAutoalojadaGuard` de M9 o uno equivalente).

### 4. El correo va a la base, no al `.env`

La API no puede escribir el `.env` (vive en el host, permisos 600) y lee `SMTP_*` una sola vez al arrancar. `PATCH /instalacion/correo { smtp }` cifra la contraseña con `CifradorVariables` y llama a `guardarCorreo({ tipo: "smtp", smtp })`; `{ sinCorreo: true }` → `guardarCorreo({ tipo: "sin-correo" })`. La respuesta nunca devuelve la contraseña.

`POST /instalacion/correo/prueba { smtp }` manda un correo de prueba al administrador con un transporte armado con **esos** datos (sin guardarlos) y mide el tiempo. Un rechazo del servidor responde 502 con el mensaje del SMTP.

### 5. M10 lee el correo en cada envío

`CorreoSegunInstalacion extends CorreoPuerto` (Proxy/Strategy) lee `correo()` en cada `enviar`: `smtp` → descifra y manda por ese servidor; `sin-correo` → no manda (como `CorreoConsolaAdaptador`); `entorno` → delega en el adaptador de `SMTP_*` de hoy. En `NotificacionesModule` queda **dentro** de `CorreoConRegistro`, que sigue anotando el último envío para la salud de 32. Fabricar el transporte va por una función inyectada (como `transporteNodemailer` hoy): las pruebas no abren conexiones.

### 6. Máquina de pasos en la web

Un paso no se marca hecho sin la respuesta de la API (regla de `Pasos`). El estado del asistente es una función pura (`pasoSiguiente(estado, evento)`) probada con `node --test`.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `PrimeraConfiguracionService` | Service Layer | S | Código, administrador y correo; el controlador solo adapta |
| `AltaPrimerUsuario` (de M2) | Strategy | O, D | M1 no sabe del modo |
| `RepositorioConfiguracionInstalacion` (de M2) | Repository | D | M1 guarda el correo sin conocer Prisma |
| `CifradorVariables` (de M3) | Adapter | D, L | Mismo AES-GCM que las variables; doble en pruebas |
| `CorreoSegunInstalacion` | Proxy + Strategy | O, L | Cumple `CorreoPuerto`; cambiar el SMTP no exige reiniciar ni tocar quien envía |
| `CorreoConRegistro` (de M10) | Decorator | O | Envuelve al nuevo adaptador sin cambiar |
| Asistente (web) | State | S | Pasos con transiciones explícitas |

Cambios de clases y puertos: `PrimeraConfiguracionService`, `InstalacionController`, `CorreoSegunInstalacion` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Fuerza bruta del código:** 8 caracteres y límite de 5 intentos por IP en 15 min.
- **Clave del SMTP:** cifrada en reposo; si se pierde `CLAVE_CIFRADO_VARIABLES`, hay que volver a escribirla (32 ya avisa de guardarla fuera del servidor).
- **Lectura por envío:** una consulta a la fila única por correo; despreciable para el volumen de avisos.
