# Proposal

Change: `feat/m9-infraestructura`. Módulo dueño: **administracion (M9)** — Eduardo. Specs tocadas: `administracion`. Historias: **SP-13 (3 pts) · **si da tiempo**** (sprint fuera de alcance, [plan-avances.md § Sprint fuera de alcance](../../../docs/plan-avances.md#sprint-fuera-de-alcance)). Pantallas: 27 Admin · Infraestructura.

## Why

El administrador no tiene cómo ver si el VPS está apretado ni si la cola de construcción está atascada. Es el punto 15 de fuera de alcance.

## What Changes

- `MetricasNodoPuerto` (CPU, memoria y disco del VPS).
- `GET /admin/infraestructura`: nodo, cola de BullMQ (`enEspera`, `enCurso`, `fallidas24h`) y la última muestra por entorno (de `MuestraMetrica`).
- Pantalla 27 de solo lectura con `GraficaUso compacta`.

## Non-goals

- Actuar sobre contenedores desde esta pantalla.
- Varios nodos.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `administracion`: «Infraestructura».

## Impact

- API: `administracion/infraestructura/`, `adapters/reales/metricas-nodo.ts` (lee `/proc` o `docker system df`).
- Web: `(admin)/admin/infraestructura`.
