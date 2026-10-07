# Design

## Contexto

El schema del núcleo (DB-01) y `SuscripcionesService` (M2) todavía no están en `main`. El servicio de M1 no puede esperar a ninguno de los dos, así que depende de puertos. Los adaptadores en memoria y el stub se reemplazan en `identidad.module.ts` sin tocar el servicio, igual que hizo M4.

## Diseño: SOLID y patrones

| Pieza | Patrón | Principio |
|---|---|---|
| `IdentidadService` | Service Layer (orquesta) | **S**: no arma HTML, no habla SMTP, no calcula hashes ni lee el reloj del sistema |
| `PoliticaContrasena` + `REGLAS_CONTRASENA` | Objeto de valor / Strategy | **S**, **O**: una regla nueva es una entrada en la lista; la reutilizan recuperación y Seguridad |
| `RepositorioUsuarios`, `RepositorioTokensCuenta` | Repository | **D**: memoria hoy, Prisma con DB-01; **I**: solo los métodos que usa M1 |
| `HashContrasena` → `HashContrasenaScrypt` | Adapter | **D**: `scrypt` de Node, sin dependencias nativas; se prueba aparte |
| `GeneradorToken` → `GeneradorTokenCripto` | Adapter | **D**: las pruebas usan tokens deterministas |
| `AsignacionSandboxPuerto` → `AsignacionSandboxStub` | Puerto estrecho hacia M2 | **I**, **D**: M1 no depende de todo `SuscripcionesService` |
| `Reloj` (compartido) | Inyección de tiempo | **D**: el vencimiento de 24 h se prueba con `RelojFijo` |
| `ErroresIdentidadFilter` | Exception Filter en el borde | **S**: el dominio lanza errores con nombre; el borde los traduce a HTTP |

## Contrato HTTP

| Ruta | Cuerpo | Éxito | Errores (`codigo`) |
|---|---|---|---|
| `POST /identidad/registro` | `{ correo, contrasena, confirmacion }` | 201 `{ usuarioId, correoEnmascarado, estadoCuenta: "pendiente", correoEnviado }` | 400 `CorreoInvalido`, `ContrasenaDebil` (+ `reglasIncumplidas`), `ContrasenasNoCoinciden`; 409 `CorreoYaRegistrado` |
| `POST /identidad/verificacion` | `{ token }` | 200 `{ estadoCuenta }` | 410 `TokenNoValido` |

## Decisiones

- **La verificación es `POST`**: la página `/verificar?token=` llama a la API. Abrir un enlace (o que un escáner de correo lo abra) no debe consumir el token por sí solo.
- **Un solo `TokenNoValido` hacia fuera** para token inexistente, vencido o usado (la pantalla 02 muestra lo mismo); el motivo queda en el error para el log y las pruebas.
- **Nombre desde el correo**: la pantalla 01 no pide nombre y el schema lo exige (≤ 64). Se toma de la parte local (`derek@…` → «Derek»); se edita en Mi cuenta (M1-06).
- **Si el correo falla, la cuenta queda creada** y la respuesta dice `correoEnviado: false`. Reintentar el alta daría `CorreoYaRegistrado`. Hasta que llegue el reenvío (M1-04), la pantalla 01b remite a soporte@deploya.app y no promete un reenvío que no existe.
- **El reenvío con cuenta atrás sigue siendo requisito** del spec (verificación de correo). La ficha 02 lo deja para A2: se implementa en M1-04 y este change no lo cubre.
- **Cuenta suspendida no se reactiva** al verificar: el token se consume y se devuelve el estado actual. La web solo muestra «Cuenta activada» si `estadoCuenta === "activa"`; en otro caso, «Tu cuenta no está activa».
- **Correo enmascarado en la API** (`a•••z@t•••••••o.com`): la web no necesita el correo completo después del alta.
- **Web**: lógica pura sin imports en `lib/cuenta.ts` (se prueba con `node --test` y strip-types); `lib/api-identidad.ts` solo hace `fetch`.
- **Un solo `POST` por token en `/verificar`**: React Strict Mode monta el efecto dos veces en desarrollo; un `useRef` con el token enviado evita el segundo `POST`, que daría 410 aunque la cuenta ya quedó activa. No se relaja el «un solo uso» de la API.
- **Header público por grupo de rutas**: `app/layout.tsx` envuelve todas las rutas, así que un layout de `(auth)` no podía quitar la navegación del panel. `MarcoApp` (en el layout raíz) lee el grupo activo con `useSelectedLayoutSegment()` y usa el header público (Planes · tema · Iniciar sesión) para `(auth)` y el del panel para lo demás. Se elige por grupo, no por URL: una pantalla nueva de `(auth)` lo recibe sin tocar el marco (O). No se movieron carpetas de otros módulos.

## Riesgos

- En memoria, un reinicio de la API borra las cuentas. Es aceptable hasta DB-01; la migración cambia solo el binding.
- Con Prisma (DB-01), leer y escribir tienen que ser una sola operación atómica: `marcarUsado` condicional (`usadoEn IS NULL`) y alta protegida por el índice único de `correo` (traducir la violación a `CorreoYaRegistrado`).

## Diagramas

`clases-unificado.mmd`: `IdentidadService` con sus cinco puertos y `AsignacionSandboxPuerto ..> SuscripcionesService`. `m1-actividad-registro.mmd` y `m1-actividad-verificacion-correo.mmd` muestran el flujo real de este change: Sandbox pedido a M2, camino de `correoEnviado: false`, 410 sin revelar el motivo y cuenta no pendiente sin reactivar. La auditoría y el reenvío no están en el núcleo de A1.
