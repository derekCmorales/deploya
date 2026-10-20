# Proposal

Change: `feat/m7-bitacoras-ejecucion`. Módulo dueño: **observabilidad (M7)** — Eduardo (adaptador revisado por Derek). Specs tocadas: `observabilidad`. Historias: **SP-12 (3 pts) · **si da tiempo**** (sprint fuera de alcance, [plan-avances.md § Sprint fuera de alcance](../../../docs/plan-avances.md#sprint-fuera-de-alcance)). Pantallas: 15 Bitácoras de ejecución.

## Why

Cuando una app falla en ejecución, el cliente solo ve la bitácora de construcción. Es el punto 3 de fuera de alcance.

## What Changes

- `ContenedorPuerto.bitacora(id, { desde, max: 500 })` con `docker logs --since --timestamps`.
- `GET /proyectos/:id/bitacora?desde=`; consulta cada 3 s (ADR 0006).
- Pestaña Bitácoras (15): filtro por nivel, búsqueda, pausa sin perder líneas y descarga.

## Non-goals

- Guardar la salida en Deploya o retención por plan.
- WebSocket o SSE.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `observabilidad`: «Bitácora de ejecución».

## Impact

- API: `ContenedorPuerto.bitacora` y su adaptador; `observabilidad/bitacora/`.
- Web: `projects/[proyecto]/bitacoras/page.tsx` con `Bitacora`; la pestaña aparece solo si este change entra.
