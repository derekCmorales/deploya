# M1 Identidad y acceso

Dueño: Eddy. Spec: [`openspec/specs/identidad/spec.md`](../../../../../openspec/specs/identidad/spec.md). Alcance: [docs/alcance.md](../../../../../docs/alcance.md).

**Núcleo v4.1:** Registro, verificación de correo, iniciar y cerrar sesión, recuperar contraseña, Mi cuenta, roles Cliente / Administrador. Exporta `SesionGuard` y `@UsuarioActual()` para el resto de módulos.

**Pantallas:** 01–05, 28 (403 y sesión expirada).

**Fuera de alcance (solo si da el tiempo):** Auditoría completa, roles Operador y Soporte, cambio de correo, segundo factor.

Hecho:

- M1-01 y M1-02 (change `feat-m1-registro-verificacion`): `POST /identidad/registro` y `POST /identidad/verificacion`.
- M1-03 (change `feat-m1-sesion`): `POST`, `GET` y `DELETE /identidad/sesion` con cookie HttpOnly `deploya_sesion` (7 días sin actividad). `SesionGuard` y `@UsuarioActual()` se exportan para M3, M4 y los que vengan: `@UseGuards(SesionGuard)` y `@UsuarioActual("id")`.
- Usuarios, tokens y sesiones en PostgreSQL (DB-01); Sandbox vía `SuscripcionesService.asignarSandbox` (M2).
