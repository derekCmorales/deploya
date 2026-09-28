# Tasks

Cada tarea de código tiene su prueba. Sin base, red ni reloj reales: repositorios en memoria, `RelojFijo`, dobles de `CorreoPuerto` y de `GeneradorToken`.

## 1. Dominio

- [x] 1.1 `PoliticaContrasena` y `REGLAS_CONTRASENA` (mismo texto que la web); `normalizarCorreo`, `nombreDesdeCorreo`, `enmascararCorreo`, `motivoInvalidez`; errores de dominio
- [x] 1.2 Pruebas: cada regla de contraseña, normalización y formato de correo, nombre y enmascarado (01b, 02)

## 2. Puertos y adaptadores

- [x] 2.1 `RepositorioUsuarios`, `RepositorioTokensCuenta`, `HashContrasena`, `GeneradorToken`, `AsignacionSandboxPuerto`
- [x] 2.2 Adaptadores en memoria, `HashContrasenaScrypt`, `GeneradorTokenCripto`, `AsignacionSandboxStub`; binding en `identidad.module.ts`
- [x] 2.3 Pruebas: el hash no contiene la clave y solo coincide con ella; tokens distintos con huella sha256 estable
- [ ] 2.4 Adaptadores Prisma de `Usuario` y `TokenCuenta` cuando DB-01 esté en `main` (`marcarUsado` condicional)
- [ ] 2.5 Cambiar `AsignacionSandboxStub` por el adaptador a `SuscripcionesService.asignarSandbox` cuando M2 lo exporte

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
- [ ] 6.2 En compose: registro → correo en Mailpit → enlace → cuenta activa
- [ ] 6.3 `/opsx-archive` tras el merge
