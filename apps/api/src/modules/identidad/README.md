# M1 Identidad y acceso

Dueño: Eddy. Spec: [`openspec/specs/identidad/spec.md`](../../../../../openspec/specs/identidad/spec.md). Alcance: [docs/alcance.md](../../../../../docs/alcance.md).

**Núcleo v4.1:** Registro, verificación de correo, iniciar y cerrar sesión, recuperar contraseña, Mi cuenta, roles Cliente / Administrador. Exporta `SesionGuard` y `@UsuarioActual()` para el resto de módulos.

**Pantallas:** 01–05, 28 (403 y sesión expirada).

**Fuera de alcance (solo si da el tiempo):** Auditoría completa, roles Operador y Soporte, cambio de correo, segundo factor.

Hecho:

- M1-01 y M1-02 (change `feat-m1-registro-verificacion`): `POST /identidad/registro` y `POST /identidad/verificacion`.
- M1-03 (change `feat-m1-sesion`): `POST`, `GET` y `DELETE /identidad/sesion` con cookie HttpOnly `deploya_sesion` (7 días sin actividad). `SesionGuard` y `@UsuarioActual()` se exportan para M3, M4 y los que vengan: `@UseGuards(SesionGuard)` y `@UsuarioActual("id")`.
- Usuarios, tokens y sesiones en PostgreSQL (DB-01); Sandbox vía `SuscripcionesService.asignarSandbox` (M2).
- M1-04, parte de roles (change `feat-m1-estados-roles`): `RolGuard` y `@Roles()` exportados. Uso: `@UseGuards(SesionGuard, RolGuard)` y `@Roles("administrador")` en la ruta o en el controlador. Un Cliente recibe 403 `{ codigo: "SoloAdministracion" }`; sin `@Roles` la ruta solo exige sesión. `GET /administracion/acceso` ya los usa.
- M1-05 (change `feat-m1-recuperacion`): `POST /identidad/recuperacion` (202 neutro) y `POST /identidad/recuperacion/restablecer` (204, o 410 `TokenNoValido`) en `RecuperacionService`. Token de 30 minutos y un uso, uno vivo por cuenta (`invalidarVigentes`), y al restablecer se revocan todas las sesiones (`revocarTodasDe`).
- M1-04, resto (change `feat-m1-estados-roles`): `POST /identidad/verificacion/reenvio` con `{ correo }` o `{ token }` (202 neutro con `segundos`, o 429 `EsperaReenvio` antes de 60 s; `PoliticaReenvio` con el `Reloj`); `CuentaSuspendida` con `motivo` y `desde` (fecha de la `AccionAdministrativa` `suspender-cuenta` más reciente, leída por el adaptador Prisma).
- M1-06 y M1-07 (change `feat-m1-cuenta`): `GET`/`PATCH /identidad/cuenta` (nombre de 1 a 64 caracteres con `NombreCuenta`; correo y rol de solo lectura), `POST /identidad/cuenta/contrasena` (con la actual; revoca las demás sesiones con `revocarTodasMenos`, la de la cookie sigue viva) y `DELETE /identidad/sesiones` («Cerrar todas»: revoca todas y vence la cookie). Todas con `SesionGuard`.
- SP-03 (change `feat-m1-ultimo-cambio-contrasena`): cambiar la contraseña o restablecerla guarda `Usuario.contrasenaCambiadaEn` junto con el hash (`cambiarHash`); `GET /identidad/cuenta` la devuelve para «Último cambio» de 05b (`null` = nunca).
- `DirectorioCuentas` (exportado): correo y nombre de una cuenta por su id, para los avisos de M10 (`AvisosModule`).
- SP-17 (change `feat-m1-asistente-instalacion`): asistente de primera configuración en `instalacion/`. `POST /instalacion/codigo` y `/administrador` (con el código; crea el Administrador verificado y deja la sesión iniciada), `POST /instalacion/correo/prueba` y `PATCH /instalacion/correo` (sesión de administrador; la clave del SMTP se guarda cifrada en `ConfiguracionInstalacion`). En la nube o con administrador, 404. Límite de 5 códigos fallidos por IP cada 15 min.
