# Design

## Context

El trabajador ya corre tareas periódicas con BullMQ; `ContenedorPuerto` ya conoce el contenedor activo; `EtapaDespliegue` guarda `iniciada` y `terminada`.

## Decisions

### 1. Puerto aparte de `ContenedorPuerto`

Medir no es orquestar: un puerto estrecho para leer métricas (I).

### 2. Agregar en la lectura

Se guardan muestras crudas por minuto y la API promedia cada 30 min para 24 h; 1 440 filas por proyecto y día como máximo.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `MetricasContenedorPuerto` / `MetricasDockerStats` | Adapter | I, D | El trabajador no llama a Docker directo |
| `MuestrasMetricas` | Repository | L | Prisma y memoria con el mismo contrato |
| `MuestreoMetricas` | Scheduler (tarea BullMQ) | S | Una tarea, una responsabilidad |

Cambios de clases y puertos: `MetricasContenedorPuerto`, `MetricasDockerStats`, `MuestrasMetricas`, `MuestreoMetricas`, `RepositorioDespliegues.tiemposDe` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Costo de `docker stats`:** una llamada por contenedor por minuto; con 25 proyectos es aceptable en un VPS.
