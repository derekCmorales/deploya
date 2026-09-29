# M2 Suscripciones y pagos

Dueño: Javier. Spec: [`openspec/specs/suscripciones/spec.md`](../../../../../openspec/specs/suscripciones/spec.md). Alcance: [docs/alcance.md](../../../../../docs/alcance.md).

**Núcleo v4.1:** Catálogo fijo de cuatro planes, Sandbox inicial, contratación con `PasarelaPago` simulada, Mi suscripción, renovar (manual), cambiar plan, historial con comprobante, ciclo §4.4 y cuotas (proyectos y construcciones).

**Pantallas:** 06–09.

**Fuera de alcance (solo si da el tiempo):** Renovación automática, prorrateo, complementos, cancelación por el cliente.

**Exporta** `SuscripcionesService`: `asignarSandbox(usuarioId)` (idempotente, lo llama M1 al registrar) y `cuotaDe(usuarioId)` (M3, M4, M5; lanza `SuscripcionNoEncontrada`).

**Rutas:** `GET /suscripciones/health`, `GET /suscripciones/planes` (pública).

Hecho: DB-01 y M2-01 (change `feat-m2-schema-nucleo`).
