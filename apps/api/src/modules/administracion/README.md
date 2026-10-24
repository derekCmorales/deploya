# M9 Administración

Dueño: Javier. Spec: [`openspec/specs/administracion/spec.md`](../../../../../openspec/specs/administracion/spec.md). Alcance: [docs/alcance.md](../../../../../docs/alcance.md).

**Núcleo v4.1:** Usuarios (buscar, filtrar, detalle) y suspender cuenta con motivo.

**Sprint fuera de alcance:** reactivar cuenta (SP-05): `POST /admin/usuarios/:id/reactivacion`. Admin · Instalación (SP-18, solo autoalojado): `GET /admin/instalacion`, `PATCH /admin/instalacion/registro` y `/limites`, `POST` y `DELETE /admin/invitaciones`; la salud la arma `SaludInstalacion` (Composite) y la política de registro para M1 sale de `RegistroInstalacionModule`.

**Pantallas:** 25, 25b, 25c, 32.

**Fuera de alcance (solo si da el tiempo):** CRUD de planes, estado de infraestructura.

Hoy: stub con `GET /administracion/health`. Cada historia entra con su change de OpenSpec.
