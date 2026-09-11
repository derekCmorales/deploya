# Kit — Derek (arquitecto e integrador)

[@derekCmorales](https://github.com/derekCmorales) · extra: ADR, entorno, revisión transversal, despliegue.

## Tus módulos

| Id | Qué | Código |
|---|---|---|
| M4 | Cola, detector de stack, constructor, artefactos inmutables | `apps/api/src/modules/construccion` |
| M5 | Ciclo de vida del contenedor, límites, reversión | `apps/api/src/modules/orquestacion` |
| M6 | Subdominio, TLS, conmutación, dominios personalizados | `apps/api/src/modules/enrutamiento` |
| M8 tools | Capa de herramientas (consultar, desplegar, bitácoras, métricas, revertir, variables) | `apps/api/src/modules/herramientas` |

También: `apps/api/src/adapters/`, `docker-compose.yml`, Dockerfiles.

## Qué no tocas en solitario

Implementar auth (Eddy), pagos (Javier), pantallas de proyecto (Eduardo). Revisa esos PRs; no los sustituyas.

## Diagramas tuyos primero

1. [m4-m5-m6-estados-despliegue.mmd](../../diagramas/m1-m10/m4-m5-m6-estados-despliegue.mmd)
2. [m4-m5-m6-secuencia-despliegue.mmd](../../diagramas/m1-m10/m4-m5-m6-secuencia-despliegue.mmd)
3. [m4-m5-m6-secuencia-reversion.mmd](../../diagramas/m1-m10/m4-m5-m6-secuencia-reversion.mmd)
4. [m4-m5-m6-actividad-motor.mmd](../../diagramas/m1-m10/m4-m5-m6-actividad-motor.mmd)
5. [m4-m5-m6-componentes.mmd](../../diagramas/m1-m10/m4-m5-m6-componentes.mmd)
6. [m8-herramientas-componentes.mmd](../../diagramas/m1-m10/m8-herramientas-componentes.mmd)

C4 (tú lo mantienes único): [compartido/](../../diagramas/compartido/).

Estados de despliegue ≠ §4.4 de suscripción.

## Puertos (DIP)

`ContenedorPuerto`, `EnrutamientoPuerto`, `VerificacionEntornoPuerto` — sin `I`. Redis de cola M4 es **stub** en el bootstrap.

## Specs OpenSpec

- [openspec/specs/motor-construccion/spec.md](../../../openspec/specs/motor-construccion/spec.md)
- [openspec/specs/orquestacion/spec.md](../../../openspec/specs/orquestacion/spec.md)
- [openspec/specs/enrutamiento/spec.md](../../../openspec/specs/enrutamiento/spec.md)
- [openspec/specs/herramientas/spec.md](../../../openspec/specs/herramientas/spec.md)

ADR: `docs/adr/` (crea el primero cuando haya una decisión; no hace falta en este PR).

## Primeras historias (no las implementes en el bootstrap)

1. Encolar trabajo de construcción (stub Redis).  
2. Detector de stack + receta.  
3. Orquestar contenedor vía `ContenedorPuerto` simulado.  
4. Publicar subdominio vía `EnrutamientoPuerto` simulado.  
5. Reversión a artefacto previo.

Rama: `feat/m4-<slug>`. Commit: `feat(m4):`.

## Reviewer

Tú en motor, adapters, compose. Segundo reviewer en Prisma (con Javier) y en CI (con Eddy).
