# Proposal

Change: `feat/m7-tiempo-por-etapa`. Módulo dueño: **observabilidad (M7)** — Eduardo (datos: Derek, `tiemposDe`). Specs tocadas: `observabilidad`. Historias: **SP-14 (2 pts)** (sprint fuera de alcance, [plan-avances.md § Sprint fuera de alcance](../../../docs/plan-avances.md#sprint-fuera-de-alcance)). Pantallas: 14c Despliegues · Tiempo por etapa.

## Why

El motor ya guarda cuándo empieza y termina cada etapa, pero el cliente no ve qué parte de su despliegue tarda ni dónde fallan. Muestra también lo que vale la reversión: sin construir.

## What Changes

- `GET /proyectos/:id/despliegues/tiempos?ultimos=14` sobre `RepositorioDespliegues.tiemposDe`.
- Tarjeta 14c encima de la tabla de 14 con `GraficaEtapas`: mediana, % de Construcción, fallos y última reversión; tooltip con las cinco etapas.

## Non-goals

- Comparar con otros proyectos.
- Tiempos de más de 14 despliegues.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `observabilidad`: «Tiempo por etapa».

## Impact

- API: `observabilidad/tiempos/` (`TiemposService`, controlador).
- Web: tarjeta en `projects/[proyecto]/despliegues/page.tsx` con `GraficaEtapas`.
