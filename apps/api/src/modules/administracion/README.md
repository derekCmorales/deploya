# M9 Administración

Dueño: Javier. Spec: [`openspec/specs/administracion/spec.md`](../../../../../openspec/specs/administracion/spec.md). Alcance: [docs/alcance.md](../../../../../docs/alcance.md).

**Núcleo v4.1:** Usuarios (buscar, filtrar, detalle) y suspender cuenta con motivo.

**Sprint fuera de alcance:** reactivar cuenta (SP-05): `POST /admin/usuarios/:id/reactivacion`. Admin · Instalación (SP-18, solo autoalojado): `GET /admin/instalacion`, `PATCH /admin/instalacion/registro` y `/limites`, `POST` y `DELETE /admin/invitaciones`; la salud la arma `SaludInstalacion` (Composite) y la política de registro para M1 sale de `RegistroInstalacionModule`.

**Entrega final:** limpieza diaria (EST-01b, `limpieza/`): a las 00:35 UTC el trabajador borra los `TokenCuenta` usados o vencidos hace más de 7 días, las `Sesion` revocadas hace más de 7 o sin actividad hace más de 14 y las `Invitacion` usadas, revocadas o vencidas hace más de 30. `POST /admin/limpieza/ejecutar` la corre a mano; 32 muestra la última corrida.

**Pantallas:** 25, 25b, 25c, 32.

**Fuera de alcance (solo si da el tiempo):** CRUD de planes, estado de infraestructura.

Hoy: stub con `GET /administracion/health`. Cada historia entra con su change de OpenSpec.
