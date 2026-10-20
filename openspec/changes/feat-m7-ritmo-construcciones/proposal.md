# Proposal

Change: `feat/m7-ritmo-construcciones`. Módulo dueño: **observabilidad (M7)** — Eduardo. Specs tocadas: `observabilidad`. Historias: **SP-15 (2 pts)** (sprint fuera de alcance, [plan-avances.md § Sprint fuera de alcance](../../../docs/plan-avances.md#sprint-fuera-de-alcance)). Pantallas: 08c Mi suscripción · Ritmo de construcciones.

## Why

El medidor de construcciones dice cuántas van, pero no si alcanzan para el mes. Una proyección al ritmo actual avisa antes de llegar al límite.

## What Changes

- `GET /observabilidad/consumo/diario` → `{ desde, reinicia, cuota, diarios }` (mes calendario UTC, igual que el bloqueo).
- `GraficaRitmo` dentro de `ConsumoPeriodo` (08c): acumulado, columnas por día, proyección punteada al cierre, zona de aviso y la frase que dice si alcanza.

## Non-goals

- Meses anteriores.
- Proyección por proyecto.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `observabilidad`: «Ritmo de construcciones».

## Impact

- API: `observabilidad/consumo/` (`ConsumoService.diario`).
- Web: `ConsumoPeriodo` gana `GraficaRitmo`; `lib/proyeccion.ts`.
