# M1 Identidad y acceso

Dueño: Eddy. Spec: [`openspec/specs/identidad/spec.md`](../../../../../openspec/specs/identidad/spec.md). Alcance: [docs/alcance.md](../../../../../docs/alcance.md).

**Núcleo v4.1:** Registro, verificación de correo, iniciar y cerrar sesión, recuperar contraseña, Mi cuenta, roles Cliente / Administrador. Exporta `SesionGuard` y `@UsuarioActual()` para el resto de módulos.

**Pantallas:** 01–05, 28 (403 y sesión expirada).

**Fuera de alcance (solo si da el tiempo):** Auditoría completa, roles Operador y Soporte, cambio de correo, segundo factor.

Hoy: stub con `GET /identidad/health`. Cada historia entra con su change de OpenSpec.
