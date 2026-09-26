# M10 Notificaciones

Dueño: Eddy. Spec: [`openspec/specs/notificaciones/spec.md`](../../../../../openspec/specs/notificaciones/spec.md). Alcance: [docs/alcance.md](../../../../../docs/alcance.md).

**Núcleo v4.1:** `CorreoPuerto` y dos correos: verificación y recuperación. Adaptadores: `CorreoSmtpAdaptador` (Mailpit en desarrollo, proveedor externo en producción; solo cambian variables) y `CorreoConsolaAdaptador` (pruebas). El binding vive en `notificaciones.module.ts`. Decisión: [ADR 0001](../../../../../docs/adr/0001-correo-por-smtp-configurable.md).

**Pantallas:** 24.

**Fuera de alcance (solo si da el tiempo):** Correos de resultado de despliegue, de vencimiento de plan y de cuota.

Hoy: stub con `GET /notificaciones/health`. Cada historia entra con su change de OpenSpec.
