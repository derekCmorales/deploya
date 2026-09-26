# M4 Motor de construcción

Dueño: Derek. Spec: [`openspec/specs/motor-construccion/spec.md`](../../../../../openspec/specs/motor-construccion/spec.md). Alcance: [docs/alcance.md](../../../../../docs/alcance.md).

**Núcleo v4.1:** Cola BullMQ, clonar, `docker build` con el `Dockerfile` del cliente, artefacto versionado con digest, bitácora; cancelar, reintentar y redesplegar (reconstruye).

**Pantallas:** 12, 14 (vía M7).

**Fuera de alcance (solo si da el tiempo):** Detección de stack, reversión sin reconstruir.

Hoy: stub con `GET /construccion/health`. Cada historia entra con su change de OpenSpec.
