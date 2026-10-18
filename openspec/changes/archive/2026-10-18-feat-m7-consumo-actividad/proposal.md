# Proposal

Change: `feat/m7-consumo-actividad`. Módulo dueño: **observabilidad (M7)** — Eduardo. Spec tocada: `observabilidad`. Historia: **M7-03** Consumo del período y actividad (2 pts, Avance 3). Pantallas 08 (bloque de consumo) y 13 (mapa de actividad).

## Why

Mi suscripción muestra los proyectos usados pero no las construcciones del mes, y el resumen del proyecto tiene reservado el mapa de actividad de 12 semanas. Los dos datos ya existen (`contarConstruccionesDesde` de M5-03 y los despliegues de M4); falta exponerlos y pintarlos con componentes que ya están en el kit (`Meter`, `MapaActividad`).

## What Changes

- `GET /observabilidad/consumo` → `{ periodo: { desde, reinicia }, proyectos: { usados, limite }, construcciones: { usadas, limite } }`. Mes calendario UTC, igual que el bloqueo (invariante I7).
- `GET /proyectos/:id/actividad` → `{ dias: [{ fecha, total, fallidos }], total, fallidos }` con los 84 días que terminan hoy (UTC).
- Funciones puras `agruparPorDia(despliegues, hoy, dias)` y `periodoDe(hoy)`.
- Web:
  - `<ConsumoPeriodo />` en 08: dos `Meter` (proyectos y construcciones) con «Se reinicia el 1 nov». Javier deja el hueco en su pantalla.
  - `<ActividadProyecto proyectoId />` con `MapaActividad` y el texto «12 semanas · N despliegues · M con fallo». Derek lo monta en 13.

## Non-goals

- Métricas de CPU y memoria en vivo (fuera de alcance, punto 2).
- Avisos de cuota por correo.
- Consumo de meses anteriores.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `observabilidad`: «Consumo del período» con construcciones, fecha de reinicio y actividad de 12 semanas.

## Impact

- Código: `observabilidad/consumo/` (`ConsumoService`, `ActividadService`), puertos de lectura sobre M2 (`cuotaDe`), M3 (proyectos del usuario) y M4 (`contarConstruccionesDesde`, despliegues desde una fecha).
- Web: `apps/web/src/components/deploya/` o `app/(projects)/_componentes/`: `consumo-periodo.tsx`, `actividad-proyecto.tsx`; `lib/actividad.ts`.
- Sin cambios de tablas.
