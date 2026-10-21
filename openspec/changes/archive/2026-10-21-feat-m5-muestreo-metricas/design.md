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

- Serie `24h`: 48 cubos de 30 min **alineados a :00/:30 UTC**. El último es el que contiene `ahora` (`floor(ahora / 30 min) × 30 min`) y los demás van hacia atrás; `en` es el inicio del cubo, así la gráfica no "baila" entre peticiones. Un cubo sin muestras no entra (no se rellena con 0). Con muestras en los 48 cubos, la serie trae 48 puntos. La ventana de 24 h empieza en el primer cubo (a lo sumo 30 min después de `ahora − 24 h`), así serie, pico, chips y promedios miran el mismo intervalo. Serie `1h`: un punto por minuto que tenga muestra, `en` es el minuto truncado.
- `pico` (`cpu` y `memoriaMb`, cada uno con `valor` y `en`) es el máximo de las muestras **crudas** de la ventana: los promedios de 30 min esconden el pico que la pantalla 16 muestra («Pico: 452 MB, hoy 14:00»). En un empate gana la muestra más antigua. Es `null` por medida si no hay muestras.
- Si el despliegue activo no está Saludable (o no hay activo), `serie` va vacía, `pico` va en `null` y `aviso` trae «El contenedor no está corriendo»; si corre, `aviso` es `null`. `despliegues` y `promedioPorVersion` siguen saliendo de la ventana.
- Muestreo en lotes de `CONTENEDORES_EN_PARALELO` (5) con `Promise.all` por lote: con timeout de 10 s por contenedor, un tick secuencial con varios colgados pasaba de 60 s. La concurrencia acotada no abre N llamadas a Docker a la vez; un contenedor ilegible se registra y no frena al resto.
- `despliegues[].en` es `Despliegue.creado`. `deProyecto` incluye `version` (el `numero`) para armar el promedio sin otra consulta; el JSON no expone el id.
- `tiemposDe` devuelve los últimos `ultimos` del más antiguo al más reciente. Duración = `terminada − iniciada` en ms. Etapa omitida, sin marcas, o posterior a `falloEn` = 0. `falloEn` solo si el estado es `fallido`. `reversion` es `disparador = reversion`.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `MetricasContenedorPuerto` / `MetricasDockerStats` | Adapter | I, D | El trabajador no llama a Docker directo |
| `MuestrasMetricas` | Repository | L | Prisma y memoria con el mismo contrato |
| `MuestreoMetricas` | Caso de uso | S | Una corrida: muestrear y purgar |
| `ColaMuestreoPuerto` / `TareaMuestreoMetricas` | Scheduler (BullMQ) | S, D | Programa el tick; la prueba usa memoria |
| `MuestreoMetricas.enLotes` | Batching con concurrencia acotada | S | El tick no crece linealmente con los contenedores colgados |
| `LecturaMetricasService` | Facade de lectura | S | Compone puertos; la serie es una función pura |
| `serieDe` / `picoDe` / `desdeDe` | Función pura (objeto valor de lectura) | S | Cubos alineados, pico y ventana sin base ni reloj; se prueban con fechas fijas |
| `tiemposDeDespliegue` | Función pura | S | La duración no depende de Prisma |

`RespuestaMetricas` pasa a la versión 1.1 del contrato ([metricas.md](../../../docs/contratos/metricas.md)) con `pico` y `aviso`; el cambio es aditivo y Eduardo ya está avisado. Cambios de clases y puertos: `MetricasContenedorPuerto`, `MetricasDockerStats`, `MuestrasMetricas`, `MuestreoMetricas`, `ColaMuestreoPuerto`, `LecturaMetricasService`, `RepositorioDespliegues.tiemposDe` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Costo de `docker stats`:** una llamada por contenedor por minuto; con 25 proyectos es aceptable en un VPS.
