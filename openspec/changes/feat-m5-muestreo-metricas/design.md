# Design

## Context

El trabajador ya corre tareas periódicas con BullMQ; `ContenedorPuerto` ya conoce el contenedor activo; `EtapaDespliegue` guarda `iniciada` y `terminada`.

## Decisions

### 1. Puerto aparte de `ContenedorPuerto`

Medir no es orquestar: un puerto estrecho para leer métricas (I).

### 2. Agregar en la lectura

Se guardan muestras crudas por minuto y la API promedia cada 30 min para 24 h; 1 440 filas por proyecto y día como máximo.

### 3. La cola no entra en el caso de uso

`MuestreoMetricas` solo muestrea y purga. `ColaMuestreoPuerto` (BullMQ o memoria) programa el tick, igual que el ciclo §4.4. Así la prueba dispara la corrida sin Redis.

### 4. La lectura no distingue el modo

`limite` sale de `CuotaPlanPuerto.recursosDe`. En autoalojado, `LimitesDeInstalacion` alimenta ese mismo puerto (`instalacion.md`); esta historia no agrega un `if` por modo. `LimitesDeInstalacion` es de Javier y todavía no está.

### 5. Precisiones que el contrato deja abiertas

- Serie `24h`: cubos de 30 min que terminan en `ahora`. `en` es el inicio del cubo. Un cubo sin muestras no entra (no se rellena con 0). Con muestras en los 48 cubos, la serie trae 48 puntos. Serie `1h`: un punto por minuto que tenga muestra.
- Si el despliegue activo no está Saludable, `serie` va vacía. `despliegues` y `promedioPorVersion` siguen saliendo de la ventana.
- `despliegues[].en` es `Despliegue.creado`. `deProyecto` incluye `version` (el `numero`) para armar el promedio sin otra consulta; el JSON no expone el id.
- `tiemposDe` devuelve los últimos `ultimos` del más antiguo al más reciente. Duración = `terminada − iniciada` en ms. Etapa omitida, sin marcas, o posterior a `falloEn` = 0. `falloEn` solo si el estado es `fallido`. `reversion` es `disparador = reversion`.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `MetricasContenedorPuerto` / `MetricasDockerStats` | Adapter | I, D | El trabajador no llama a Docker directo |
| `MuestrasMetricas` | Repository | L | Prisma y memoria con el mismo contrato |
| `MuestreoMetricas` | Caso de uso | S | Una corrida: muestrear y purgar |
| `ColaMuestreoPuerto` / `TareaMuestreoMetricas` | Scheduler (BullMQ) | S, D | Programa el tick; la prueba usa memoria |
| `LecturaMetricasService` | Facade de lectura | S | Compone puertos; la serie es una función pura |
| `tiemposDeDespliegue` | Función pura | S | La duración no depende de Prisma |

Cambios de clases y puertos: `MetricasContenedorPuerto`, `MetricasDockerStats`, `MuestrasMetricas`, `MuestreoMetricas`, `ColaMuestreoPuerto`, `LecturaMetricasService`, `RepositorioDespliegues.tiemposDe` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Costo de `docker stats`:** una llamada por contenedor por minuto; con 25 proyectos es aceptable en un VPS.
