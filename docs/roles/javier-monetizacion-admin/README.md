# Kit — Javier (monetización y admin)

[@Javier-r04](https://github.com/Javier-r04) · extra: Prisma, seeds, docs de producto.

## Tus módulos

| Id | Qué | Código |
|---|---|---|
| M2 | Suscripciones y pagos simulados, catálogo, cuotas, renovación | `apps/api/src/modules/suscripciones` |
| M9 | Administración: usuarios, planes, estado de infraestructura | `apps/api/src/modules/administracion` |

Web: `apps/web/src/app/(billing)/`, `apps/web/src/app/(admin)/`  
Datos: `apps/api/prisma/` (CODEOWNERS: tú + Derek)

UI de planes y admin: [kit-visual.md](../../kit-visual.md). Mismo shell y tokens; estados §4.4 en copy, no mezclarlos con Encolado/Saludable. `/billing` y `/admin` hoy son stubs que apuntan a esa guía.

## Qué no tocas (salvo PR conjunta)

Identidad M1, motor Docker, cola de construcción, UI de proyectos.

## Diagramas tuyos primero

1. [m2-estados-suscripcion.mmd](../../diagramas/m1-m10/m2-estados-suscripcion.mmd) — **§4.4** (no son estados de despliegue)
2. [m2-secuencia-contratacion-plan.mmd](../../diagramas/m1-m10/m2-secuencia-contratacion-plan.mmd)
3. [m2-secuencia-renovacion.mmd](../../diagramas/m1-m10/m2-secuencia-renovacion.mmd)
4. [m2-actividad-contratacion-activacion.mmd](../../diagramas/m1-m10/m2-actividad-contratacion-activacion.mmd)
5. [m2-m9-componentes.mmd](../../diagramas/m1-m10/m2-m9-componentes.mmd)
6. [m2-m9-clases.mmd](../../diagramas/m1-m10/m2-m9-clases.mmd) — `PasarelaPago` sin `I`
7. [m9-actividad-gestion-planes.mmd](../../diagramas/m1-m10/m9-actividad-gestion-planes.mmd)

El resto: [ERD unificado](../../diagramas/compartido/erd-unificado.mmd).

## Estados §4.4 (cuota)

Activa → Por vencer → Vencida (gracia 5 días, sin nuevos despliegues) → Suspendida (contenedores detenidos) → Cancelada. Distinto de Encolado/Saludable/Detenido del motor.

## Specs OpenSpec

- [openspec/specs/suscripciones/spec.md](../../../openspec/specs/suscripciones/spec.md)
- [openspec/specs/administracion/spec.md](../../../openspec/specs/administracion/spec.md)

## Primeras historias (no las implementes en el bootstrap)

1. Catálogo de planes Sandbox / Starter / Pro / Business.  
2. Contratación con **pago simulado** y suscripción Activa.  
3. Avance de ciclo §4.4.  
4. Seeds de planes en Prisma.

Rama: `feat/m2-<slug>`. Commit: `feat(m2):`.

## Reviewer

Tú en M2/M9 y schema. **Derek** en Prisma (segundo owner) e infra.
