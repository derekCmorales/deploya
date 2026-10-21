# Proposal

Change: `feat/m5-muestreo-metricas`. Módulo dueño: **orquestacion (M5)** — Derek. Specs tocadas: `orquestacion`, `motor-construccion`. Historias: **SP-07 (3 pts)** (sprint fuera de alcance, [plan-avances.md § Sprint fuera de alcance](../../../docs/plan-avances.md#sprint-fuera-de-alcance)). Pantallas: 16, 13c y 27 (datos).

## Why

Para graficar CPU y memoria (punto 2 de fuera de alcance) el motor tiene que medir los contenedores; hoy solo aplica los límites.

## What Changes

- `MetricasContenedorPuerto` con `MetricasDockerStats` (`docker stats --no-stream --format json`) y doble en memoria.
- `MuestreoMetricas` en el trabajador cada 60 s por despliegue activo Saludable; tabla `MuestraMetrica`; purga de 24 h.
- `GET /proyectos/:id/metricas?rango=1h|24h` con límite, serie, despliegues de la ventana y promedio por versión (contrato `metricas.md`).
- `RepositorioDespliegues.tiemposDe(proyectoId, ultimos)` para `feat-m7-tiempo-por-etapa`.

## Non-goals

- Transferencia, peticiones y errores 5xx.
- Retención mayor a 24 h o métricas por réplica.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `orquestacion`: «Métricas de contenedor».
- `motor-construccion`: «Tiempos por etapa».

## Impact

- API: `orquestacion/metricas/` (puerto, servicio de muestreo, repositorio), `adapters/reales/metricas-docker-stats.ts`, `observabilidad` (lectura); `construccion` (`tiemposDe`).
- Prisma: `MuestraMetrica` (revisa Javier).
- Contrato: `docs/contratos/metricas.md`.
