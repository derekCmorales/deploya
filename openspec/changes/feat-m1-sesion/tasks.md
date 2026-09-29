# Tasks

Sin base, red ni reloj reales: repositorios en memoria, `RelojFijo`, dobles de `HashContrasena` y `GeneradorToken`.

## 1. Dominio y puertos

- [x] 1.1 `Sesion`, `UsuarioSesion`, `sesionVigente`, `debeRefrescarActividad`; errores `CredencialesInvalidas`, `CuentaNoVerificada`, `CuentaSuspendida`
- [x] 1.2 Puerto `RepositorioSesiones` y adaptadores en memoria y Prisma

## 2. M1-03 · API

- [x] 2.1 `SesionService.iniciar`, `cerrar`, `usuarioDe`
- [x] 2.2 Pruebas: «Credenciales válidas», «Credenciales incorrectas» (clave, correo inexistente, mal formado), «Cuenta sin verificar», «Cuenta suspendida», «Sesión expirada», refresco de actividad, suspendida después de entrar, «Cerrar sesión» idempotente
- [x] 2.3 `SesionController` (`POST`, `GET`, `DELETE /identidad/sesion`), cookie, filtro 401/403
- [x] 2.4 `SesionGuard` y `@UsuarioActual()`; pruebas: «Ruta protegida sin sesión», cookie vencida, usuario en la solicitud
- [x] 2.5 M3 y M4 usan el guard; se borran `@UsuarioSolicitante()` y `USUARIO_DESARROLLO`

## 3. Persistencia y cuota (Derek)

- [x] 3.1 Adaptadores Prisma de `Usuario`, `TokenCuenta`, `Proyecto`, `Despliegue`, `Artefacto`; prueba de la traducción Prisma ↔ dominio
- [x] 3.2 Adaptadores sobre `SuscripcionesService` para M1, M3 y M5, con pruebas
- [x] 3.3 Compose: servicio `migracion`; smoke de CI comprueba los 4 planes y el 401 de `/proyectos`

## 4. Web · pantallas 03 y 03b

- [x] 4.1 `/ingresar` con los estados de 03b; `resultadoIngreso` y `destinoTrasIngreso` con pruebas (`node --test`)
- [x] 4.2 `SesionProvider`, `MenuUsuario` («Salir») y `RequiereSesion` en `(projects)`
- [x] 4.3 Recorrido completo en compose con Playwright: registro → Mailpit → verificación → ingreso → planes → proyecto → Saludable → app en `hola-deploya.localhost` → salir
