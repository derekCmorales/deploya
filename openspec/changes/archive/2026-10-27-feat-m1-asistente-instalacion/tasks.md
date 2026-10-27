# Tasks

Sin Docker, red, base ni reloj reales en las pruebas unitarias. Cada `Scenario` del spec delta tiene su `it(...)` con el mismo nombre. Contrato: `docs/contratos/instalacion.md` v1.8.

## 0. Bases (ya en `main`, no hay que hacerlas)

- [x] 0.1 Columnas `smtp*` y `sinCorreo` en `ConfiguracionInstalacion`; `RepositorioConfiguracionInstalacion.correo()` / `guardarCorreo()` (Javier, PR #52)
- [x] 0.2 `CifradorVariables` exportado por `VariablesModule`
- [x] 0.3 `AltaPrimerUsuario` (`validarCodigo`, `consumirCodigo`, `configurada`) exportado por `SuscripcionesModule` (SP-06)
- [x] 0.4 `PoliticaRegistroPuerto` conectado al registro de M1 (SP-18, PR #52)

## 1. API (M1)

- [x] 1.1 `PrimeraConfiguracionService` + `PrimeraConfiguracionController` (`identidad/instalacion/`; design.md § 7): `POST /instalacion/codigo` y `/administrador` (`{ codigo, correo, contrasena }`: vuelve a `validarCodigo`, `consumirCodigo(codigo)` atómico, crea Administrador activo —si falla, `devolverCodigo`—, `SesionService.iniciar` y `Set-Cookie`); 404 con administrador o en nube
- [x] 1.2 `POST /instalacion/correo/prueba` (transporte con los datos recibidos, sin guardarlos; 502 con el error del SMTP) y `PATCH /instalacion/correo` (cifra con `CifradorVariables`, `guardarCorreo`); los dos con `SesionGuard` + `RolGuard("administrador")`
- [x] 1.3 Límite de 5 intentos de código por IP en 15 min (cuentan `/codigo` y `/administrador`)
- [x] 1.4 Pruebas: «Código válido», «Código vencido», «Código usado», «Sesión al crear el administrador», «Administrador sin código», «Correo de prueba», «SMTP rechazado», «Correo guardado sin editar archivos», «Ya configurada»

## 2. Correo (M10)

- [x] 2.1 `CorreoSegunInstalacion extends CorreoPuerto`: lee `correo()` en cada envío; `smtp` / `sin-correo` / `entorno`
- [x] 2.2 `NotificacionesModule`: `CorreoConRegistro(CorreoSegunInstalacion(...))` en autoalojado; la nube sigue igual (Strategy por `MODO_INSTALACION`, sin `if` sueltos)
- [x] 2.3 Pruebas: «SMTP guardado», «Sin correo», «Sin configurar»; el registro del último envío sigue funcionando

## 3. Web

- [x] 3.1 `/configurar` con los cinco pasos (ficha 31): sin administrador → paso 1; con sesión de administrador → pasos 3 a 5; sin sesión → 404
- [x] 3.2 Redirección desde la raíz a `/configurar` mientras `configurada` sea `false`
- [x] 3.3 Paso 5 con `PATCH /admin/instalacion/registro` y `/limites` (los de 32)
- [x] 3.4 Pruebas `node --test` de la máquina de pasos y de los textos de la ficha 31

## 4. Cierre

- [x] 4.1 Revisión contra el canvas (página «Sprint · fuera de alcance») en claro y oscuro: panel lateral con pasos y datos del servidor, formulario en tarjeta y Atrás / Continuar debajo
- [x] 4.2 `clases-unificado.mmd` (`PrimeraConfiguracionService`, `PrimeraConfiguracionController`, `CorreoSegunInstalacion`, `PruebaCorreoPuerto`); `pnpm check` en verde
- [x] 4.3 Demo: instalación limpia → código → administrador → correo probado o «sin correo» → registro con invitación (local, `docker-compose.autoalojado.yml`: sin invitación responde 403 `InvitacionRequerida`)
- [x] 4.4 `/opsx-archive` después del merge (archivado en el PR que cierra el sprint)
