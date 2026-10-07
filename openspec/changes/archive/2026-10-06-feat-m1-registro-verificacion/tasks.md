# Tasks

Cada tarea de código tiene su prueba. Sin base, red ni reloj reales: repositorios en memoria, `RelojFijo`, dobles de `CorreoPuerto` y de `GeneradorToken`.

## 1. Dominio

- [x] 1.1 `PoliticaContrasena` y `REGLAS_CONTRASENA` (mismo texto que la web); `normalizarCorreo`, `nombreDesdeCorreo`, `enmascararCorreo`, `motivoInvalidez`; errores de dominio
- [x] 1.2 Pruebas: cada regla de contraseña, normalización y formato de correo, nombre y enmascarado (01b, 02)

## 2. Puertos y adaptadores

- [x] 2.1 `RepositorioUsuarios`, `RepositorioTokensCuenta`, `HashContrasena`, `GeneradorToken`, `AsignacionSandboxPuerto`
- [x] 2.2 Adaptadores en memoria, `HashContrasenaScrypt`, `GeneradorTokenCripto`, `AsignacionSandboxStub`; binding en `identidad.module.ts`
- [x] 2.3 Pruebas: el hash no contiene la clave y solo coincide con ella; tokens distintos con huella sha256 estable
- [x] 2.4 Adaptadores Prisma de `Usuario` y `TokenCuenta` cuando DB-01 esté en `main`, con operaciones atómicas: `marcarUsado` condicional (`usadoEn IS NULL`) y alta protegida por el índice único de `correo`
- [x] 2.5 Cambiar `AsignacionSandboxStub` por el adaptador a `SuscripcionesService.asignarSandbox` cuando M2 lo exporte

## 3. M1-01 · Registro

- [x] 3.1 `IdentidadService.registrar`; `POST /identidad/registro`; `ErroresIdentidadFilter`
- [x] 3.2 Pruebas: «Registro válido» (cuenta pendiente, Sandbox pedido, correo con enlace), «Correo ya registrado», «Contraseña débil», «Falla del correo al registrarse», hash nunca en claro, huella del token con vencimiento de 24 h; controlador (confirmación distinta, campos vacíos, 409 y 400)

## 4. M1-02 · Verificación

- [x] 4.1 `IdentidadService.verificar`; `POST /identidad/verificacion`
- [x] 4.2 Pruebas: «Token válido», «Token expirado o usado» (24 h con `RelojFijo`, un solo uso, inexistente, tipo equivocado), cuenta suspendida no se reactiva; filtro 410

## 5. Web · pantallas 01, 01b y 02

- [x] 5.1 `/registro` (patrón A) con `RequisitosContrasena` y los estados de 01b: correo ya registrado, enviando y cuenta creada
- [x] 5.2 `/verificar` (patrón B): revisa tu bandeja, cuenta activada, enlace no válido y error de API
- [x] 5.3 `lib/cuenta.ts` (lógica pura) y `lib/api-identidad.ts`; pruebas en `test/cuenta.test.mjs`
- [x] 5.4 Borrar el stub `/auth`; «Cuenta» en `nav-panel.tsx` apunta a `/registro`

## 6. Cierre

- [x] 6.1 `clases-unificado.mmd` actualizado y `pnpm diagramas:sync`
- [x] 6.2 En compose: registro (201) → correo en Mailpit → enlace → cuenta activa (200) → el mismo enlace da 410; el correo repetido da 409 y la contraseña débil 400
- [x] 6.3 `/opsx-archive` tras el merge

## 7. Correcciones de la revisión (#10)

- [x] 7.1 Spec delta: los requisitos conservan el texto vivo, incluido el reenvío con cuenta atrás (se implementa en M1-04)
- [x] 7.2 El banner de «correo no enviado» ya no promete un reenvío que no existe: remite a soporte@deploya.app
- [x] 7.3 `/verificar` no repite el `POST` con el doble efecto de Strict Mode (`useRef` con el token enviado)
- [x] 7.4 `@HttpCode(201)` explícito en el registro; la web muestra «Cuenta activada» solo con `estadoCuenta === "activa"`. Pruebas: metadata HTTP del controlador y «un 200 con la cuenta suspendida no se muestra como activada»
- [x] 7.5 Header público en las pantallas de `(auth)` (`MarcoApp` elige el marco por grupo de rutas); prueba en `test/cuenta.test.mjs`
- [x] 7.6 Diagramas de actividad de registro y verificación con el flujo real (Sandbox, `correoEnviado: false`, 410 y cuenta no pendiente; sin auditoría ni reenvío) y `pnpm diagramas:sync`
- [x] 7.7 README de `(auth)`: enlaces que dan 404 hasta M1-03 y M1-05
- [x] 7.8 Ilustración de acceso de la pantalla 01 (`registro/ilustracion-registro.tsx`) según el artboard `01-Registro`, con los colores del sistema por variables CSS. Movimiento del canvas con las utilidades compartidas de `globals.css`: la órbita de rayas gira (`dy-giro-lento`, 18 s) y el punto de Señal flota (`dy-flota`); la barra de Señal queda quieta al 30 %. Se apagan con `prefers-reduced-motion`. Verificada en la app en claro y oscuro
- [x] 7.9 Revisión contra el canvas v4.1 en claro y oscuro (01, 01b y 02): coinciden con el diseño de A1; el reenvío con cuenta atrás de 02 llega con M1-04
