# Diagramas por módulo (M1–M10)

Copias pulidas (sin prefijo `I`; los diagramas no duplican el kit de `apps/web`). Canon de ERD y C4: [../compartido/](../compartido/).

| Módulo | Archivos |
|---|---|
| M1 + M10 | `m1-*`, `m1-m10-*` |
| M2 + M9 | `m2-*`, `m9-*`, `m2-m9-*` |
| M3 + M7 | `m3-*`, `m7-*`, `m3-m7-*` |
| M4 + M5 + M6 | `m4-m5-m6-*` |
| M8 | `m8-herramientas-componentes.mmd` |

## Alcance núcleo v4.1

Los diagramas documentan el diseño completo de la propuesta. Estos quedan como referencia de lo que está **fuera de alcance · solo si da el tiempo** ([alcance.md](../../alcance.md)):

| Archivo | Qué parte queda fuera |
|---|---|
| `m4-m5-m6-secuencia-reversion.mmd` | Reversión sin reconstruir (en el núcleo se redespliega el commit) |
| `m8-herramientas-componentes.mmd` | M8 completo |
| `m7-actividad-consultar-metricas.mmd` | Métricas de CPU/memoria en vivo |
| `m9-actividad-gestion-planes.mmd` | CRUD de planes (catálogo fijo por seed) |
| `m2-actividad-renovacion.mmd`, `m2-secuencia-renovacion.mmd` | La rama de renovación automática |
| `m3-actividad-crear-proyecto.mmd` | La rama de archivo comprimido y la detección de stack |
| `m1-m10-casos-de-uso-autenticacion.mmd` | Actores Operador y Soporte |

`m4-m5-m6-estados-despliegue.mmd` ya está actualizado al núcleo (sin Revirtiendo, con Cancelado).
