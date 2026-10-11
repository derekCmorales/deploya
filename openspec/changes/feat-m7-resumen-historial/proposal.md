# Proposal

Change: `feat/m7-resumen-historial`. Módulo: **observabilidad (M7)** sobre datos de M3 y M4 — Derek. Spec tocada: `observabilidad`. Historia: **M7-02** Resumen e historial del proyecto (3 pts, Avance 3). Pantallas 13 y 14.

## Why

Las pestañas Resumen y Despliegues del proyecto siguen diciendo «llega en el Avance 3». Son las pantallas desde las que el cliente opera (reiniciar, detener, redesplegar, **revertir**), así que sin ellas M4-02 y M5-04 no se pueden demostrar desde la web.

## What Changes

- `GET /proyectos/:id/resumen` → `{ proyecto: { id, nombre, subdominio, url, repositorio, rama, receta, puertoInterno }, plan: { codigo, nombre }, activo: VistaDespliegue | null, ultimo: VistaDespliegue | null, recursos: { cpus, memoriaMb } | null, lineaTiempo: [{ etapa, titulo, detalle, marca }] }`.
- `GET /proyectos/:id/despliegues?filtro=todos|saludables|fallidos&antesDe=<numero>` → `{ despliegues: [FilaHistorial], siguiente: number | null }`, 20 por página, del más reciente al más antiguo. `FilaHistorial = { id, numero, estado, disparador, commit: { sha, mensaje, rama }, creado, duracionMs, imagen: { digest, disponible } | null, activo, artefactoId }`.
- `LineaTiempoDespliegue` arma los cuatro hitos de 13 (Commit recibido, Imagen construida, Contenedor iniciado, Tráfico redirigido) desde las etapas y la bitácora, sin texto libre de Docker.
- Web: `/projects/[proyecto]` (13) y `/projects/[proyecto]/despliegues` (14) dentro del layout que ya existe (`MarcoProyecto`). En 13: Visitar, Reiniciar, Detener, Desplegar, copiar URL, versión activa, recursos, línea de tiempo y el hueco de «Actividad de despliegues» para el componente de M7-03. En 14: filtros `Segmented`, tabla, fila activa resaltada y, por fila, Redesplegar / Reintentar (M4-02) y Revertir (M5-04).

## Non-goals

- Métricas en vivo y bitácora de ejecución (fuera de alcance, puntos 2 y 3).
- Mapa de actividad de 12 semanas y consumo: son M7-03 (`feat-m7-consumo-actividad`).
- WebSocket o SSE: polling cada 3 s mientras haya un despliegue en curso.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `observabilidad`: «Resumen del proyecto» e «Historial de despliegues» con paginación, fila activa y acciones por fila.

## Impact

- Código API: `observabilidad/resumen/` (`ResumenProyectoService`, `LineaTiempoDespliegue`), `RepositorioDespliegues.historialDe(proyectoId, filtro, antesDe, limite)`; `DesplieguesController` suma la ruta de historial.
- Web: `apps/web/src/app/(projects)/projects/[proyecto]/page.tsx` y `despliegues/page.tsx`; `lib/historial.ts`.
- Contrato: `docs/contratos/despliegues.md` v3.
- Sin cambios de tablas.
