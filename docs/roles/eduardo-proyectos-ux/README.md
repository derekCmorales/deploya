# Kit — Eduardo (proyectos y experiencia)

[@Portillo17e](https://github.com/Portillo17e) · extra: kit visual, accesibilidad, guion de demo.

Alcance: [alcance.md](../../alcance.md) · Entregas: [plan-avances.md](../../plan-avances.md).

## Tus módulos

| Id | Qué entra (núcleo v4.1) | Código |
|---|---|---|
| M3 | Lista y alta de proyectos desde repo público de GitHub con `Dockerfile`, variables cifradas, configuración y eliminación | `apps/api/src/modules/proyectos` |
| M7 | Vista de despliegue (riel + bitácora por polling), resumen, historial, consumo y actividad | `apps/api/src/modules/observabilidad` |
| Web | Kit visual y todas las rutas de producto | `apps/web` **salvo** `(auth)` (Eddy), `(billing)` y `(admin)` (Javier) |

M8 (UI del asistente) quedó **fuera de alcance**.

## Tus pantallas (canvas Deploya v4.1)

| # | Pantalla | Historia |
|---|---|---|
| Main | Identidad visual v4.1 | WEB-01 |
| 10, 10b | Proyectos y primer proyecto | M3-01 |
| 11a, 11d, 11e | Nuevo proyecto: Repositorio, Revisar, errores | M3-02 |
| 11c, 17 | Variables (alta y proyecto) | M3-03 |
| 12, 12b, 12c | Despliegue en curso, Saludable, Fallido | M7-01 (motor: Derek) |
| 13, 14 | Resumen e historial | M7-02 |
| 19, 19b | Configuración y eliminar | M3-04 |
| 10c, 28 | Suscripción vencida y estados del sistema | WEB-02 |
| 08 (consumo), 13 (actividad) | Consumo del período y actividad | M7-03 |

## Kit visual — alinear a v4.1

El kit del repo es monocromático y oscuro por defecto; el canvas v4.1 (posterior) es **claro por defecto**, con neutros cálidos, un azul **Señal** solo para lo que está en curso y colores de estado (`--ok`, `--warn`, `--bad`, `--destructive`). WEB-01 lleva esos tokens a `apps/web/src/app/globals.css` y actualiza [kit-visual.md](../../kit-visual.md). Si el equipo prefiere quedarse monocromático, anótalo en un ADR y sigue.

Accesibilidad: semántica, foco visible, contraste en ambos temas, botones reales.

## Qué entregas

| Avance | Historias | Pts |
|---|---|---|
| **A1 (30 %)** | WEB-01 kit v4.1 + shell del panel · M3-01 lista · M3-02 alta, revisar y desplegar | 10 |
| A2 (50 %) | M7-01 vista de despliegue · M3-03 variables cifradas | 8 |
| A3 (80 %) | M7-02 resumen e historial · M3-04 configuración y eliminar · WEB-02 estados del sistema · M7-03 consumo y actividad | 10 |
| Final | DOC-02 guion, video y accesibilidad | 3 |

Detalle del Avance 1 y lo que presentas: [plan-avances.md § Eduardo](../../plan-avances.md#eduardo--proyectos-10-pts).

**Dependencias:** schema de Javier (lunes), contrato de la API de despliegues de Derek (martes), guard de sesión de Eddy (miércoles; antes usa el usuario del seed).

## Fuera de alcance · solo si da el tiempo

Carga por zip · repos privados · recetas sin `Dockerfile` · métricas de CPU/memoria en vivo · bitácoras de runtime · WebSocket/SSE · UI del asistente M8.

## Qué no tocas (salvo PR conjunta)

Auth real, pagos, cola M4, Docker, schema de planes.

## Diagramas

1. [m3-actividad-crear-proyecto.mmd](../../diagramas/m1-m10/m3-actividad-crear-proyecto.mmd) — la rama de zip queda fuera
2. [m3-m7-componentes.mmd](../../diagramas/m1-m10/m3-m7-componentes.mmd)
3. [m3-m7-clases.mmd](../../diagramas/m1-m10/m3-m7-clases.mmd) — `ProveedorFuente`; en el núcleo solo `FuenteRepositorio`
4. [m7-actividad-consultar-metricas.mmd](../../diagramas/m1-m10/m7-actividad-consultar-metricas.mmd) — fuera de alcance (métricas en vivo)

## Specs OpenSpec

- [openspec/specs/proyectos/spec.md](../../../openspec/specs/proyectos/spec.md)
- [openspec/specs/observabilidad/spec.md](../../../openspec/specs/observabilidad/spec.md)

Rama `feat/m3-<slug>` o `feat/m7-<slug>`. Commit `feat(m3):`.

## Reviewer

Tú en M3/M7 y UI. **Derek** si el cambio toca compose o el contrato del motor.
