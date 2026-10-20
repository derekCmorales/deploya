# Proposal

Change: `feat/m7-metricas`. Módulo dueño: **observabilidad (M7)** — Eduardo (datos: Derek, `feat-m5-muestreo-metricas`). Specs tocadas: `observabilidad`. Historias: **SP-10 (4 pts), SP-11 (1 pt)** (sprint fuera de alcance, [plan-avances.md § Sprint fuera de alcance](../../../docs/plan-avances.md#sprint-fuera-de-alcance)). Pantallas: 16 Proyecto · Métricas; 13c Resumen · Últimas 24 h.

## Why

El cliente ve el estado y la bitácora de construcción, pero no cuánto usa su contenedor ni qué versión cambió ese uso. Es el punto 2 de fuera de alcance.

## What Changes

- Familia de gráficas en `components/deploya` (SVG a mano, sin librerías): `GraficaUso`, `GraficaEtapas`, `GraficaRitmo`, con piezas compartidas (escalas, ejes, chip de evento, punto en vivo, tooltip). Al catálogo `/sistema` y a `docs/diseno/README.md § Gráficas`.
- Pestaña Métricas (16): `Segmented` 1 h / 24 h, banner desde el 80 %, chips de despliegue, promedios por versión, «Ver tabla».
- Tarjeta «Últimas 24 h» en 13 (13c).

## Non-goals

- Transferencia, peticiones o errores 5xx.
- Alertas por correo de uso.
- Librerías de gráficas.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `observabilidad`: «Métricas del proyecto».

## Impact

- Web: `components/deploya/graficas/` (`grafica-uso.tsx`, `grafica-etapas.tsx`, `grafica-ritmo.tsx`, `escalas.ts`, `tooltip.tsx`), `/sistema`, `projects/[proyecto]/metricas/page.tsx`, tarjeta de 13; `MarcoProyecto` gana la pestaña Métricas.
- Docs: `docs/diseno/README.md § Gráficas` (ya en el PR 0).
