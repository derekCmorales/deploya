# Kit — Eduardo (proyectos y experiencia)

[@Portillo17e](https://github.com/Portillo17e) · extra: accesibilidad, guion de demo. **UI M8** (panel del asistente).

## Tus módulos

| Id | Qué | Código |
|---|---|---|
| M3 | Proyectos y fuentes: alta, repo o zip, receta, variables cifradas | `apps/api/src/modules/proyectos` |
| M7 | Observabilidad: bitácoras en vivo, métricas, avisos de cuota | `apps/api/src/modules/observabilidad` |
| M8 UI | Superficie del asistente en el panel | `apps/web` (rutas de producto) |

Web: `apps/web/src/app/(projects)/` y el resto de `apps/web` **salvo** `(auth)` (Eddy), `(billing)` y `(admin)` (Javier).

## Qué no tocas (salvo PR conjunta)

Auth real, pagos, cola M4, Docker, Prisma de planes.

## Sistema de diseño — kit canónico

Canon en `apps/web`: SaaS oscuro, Geist, acento cian, shadcn + Lucide + xyflow. README: [apps/web/README.md](../../../apps/web/README.md). Pantallas de validación con datos mock. Accesibilidad: semántica, foco, contraste del tema oscuro. No implementar auth, pagos ni motor reales.

## Diagramas tuyos primero

1. [m3-actividad-crear-proyecto.mmd](../../diagramas/m1-m10/m3-actividad-crear-proyecto.mmd)
2. [m7-actividad-consultar-metricas.mmd](../../diagramas/m1-m10/m7-actividad-consultar-metricas.mmd)
3. [m3-m7-componentes.mmd](../../diagramas/m1-m10/m3-m7-componentes.mmd)
4. [m3-m7-clases.mmd](../../diagramas/m1-m10/m3-m7-clases.mmd) — `ProveedorFuente` (no `ISourceProvider`)

El resto: [C4 / ERD](../../diagramas/compartido/). M3 termina en proyecto persistido; encolar construcción es M4.

## Specs OpenSpec

- [openspec/specs/proyectos/spec.md](../../../openspec/specs/proyectos/spec.md)
- [openspec/specs/observabilidad/spec.md](../../../openspec/specs/observabilidad/spec.md)

## Primeras historias (no las implementes en el bootstrap)

1. Alta de proyecto con fuente repositorio.  
2. Alta con archivo comprimido.  
3. Variables de entorno cifradas.  
4. Panel de métricas (placeholder accesible).  
5. Guion de demo del recorrido §3.1.

Rama: `feat/m3-<slug>`. Commit: `feat(m3):`.

## Reviewer

Tú en M3/M7 y UI. **Derek** si el cambio toca compose o el contrato del motor.
