# Design

## Context

Depende de `feat-m5-muestreo-metricas` (muestras) y de la familia de gráficas de `feat-m7-metricas`.

## Decisions

### 1. Solo lectura

Igual que en Deploya V4: este módulo observa, no orquesta.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `MetricasNodoPuerto` | Adapter | I, D | Leer el nodo detrás de un puerto |
| `InfraestructuraService` | Facade de lectura | S | Junta nodo, cola y muestras |

Cambios de clases y puertos: `MetricasNodoPuerto`, `InfraestructuraService` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Permisos del contenedor de la API** para leer el nodo: se usa lo que expone Docker, sin privilegios extra.
