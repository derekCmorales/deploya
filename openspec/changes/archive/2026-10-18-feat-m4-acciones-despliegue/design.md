# Design

## Context

El pipeline (`PipelineDespliegue`) corre los pasos en el trabajador y `TransicionesDespliegue` ya permite `encolado → cancelado`, `construyendo → cancelado` y `revirtiendo → cancelado`. La API nunca habla con Docker: necesita avisarle al trabajador que corte.

## Goals / Non-Goals

**Goals:** cancelar sin dejar contenedores ni imágenes a medias, reintentar y redesplegar reutilizando `crearDespliegue`.

**Non-Goals:** revertir (M5-04), cancelar la conmutación.

## Decisions

### 1. Cancelar: dos caminos, un resultado

`AccionesDespliegueService.cancelar(id, usuarioId)`:

- **Encolado:** `ColaConstruccionPuerto.quitar(id)`; si BullMQ ya lo tomó, cae al segundo camino.
- **Construyendo / Revirtiendo:** `CancelacionesPuerto.pedir(id)` (clave Redis `cancelacion:<id>` con TTL de 10 min). El pipeline crea un `AbortController` por despliegue y un `VigiaCancelacion` que consulta `CancelacionesPuerto.pedida(id)` cada `INTERVALO_VIGIA_MS = 1000`; al verla, aborta. `ConstructorImagenDocker` mata el proceso de `docker build` con la señal; `PasoRecepcion` borra la carpeta clonada.

El trabajador es quien escribe `cancelado` (con la etapa en curso `fallida` y la línea «Cancelado por el usuario»). La API responde 200 en cuanto la petición quedó registrada: la web ve el estado final por el polling de siempre.

### 2. Reintentar y redesplegar son despliegues nuevos

Ambos llaman a `ConstruccionService.crearDespliegue(proyectoId, disparador, { commitSha })`. `PasoRecepcion` hace `git fetch` + `git checkout <commitSha>` cuando viene fijado. La validación del commit (`commit-desconocido`) mira los despliegues del proyecto con ese `commitSha`.

### 3. Reglas como tabla

`PoliticaAcciones` pura: qué acción se permite desde qué estado (`cancelar`: encolado, construyendo, revirtiendo; `reintentar`: fallido). Mismo estilo que `accion-contenedor.ts` de M5.

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `AccionesDespliegueService` | Service Layer (Facade) | S | Valida y delega; no toca Docker |
| `PoliticaAcciones` | Tabla de estados (State) | O | Una acción nueva es una fila |
| `CancelacionesPuerto` → `CancelacionesRedis` / `CancelacionesMemoria` | Adapter | D, L | La señal API → trabajador se prueba sin Redis |
| `VigiaCancelacion` | Observer (polling) + `AbortSignal` | S | El pipeline no sabe de Redis; los pasos solo reciben la señal |
| `ConstructorImagenPuerto.construir(…, señal)` | Adapter | I | Un parámetro opcional; el stub lo respeta igual |

Cambios de clases: `AccionesDespliegueService`, `PoliticaAcciones`, `CancelacionesPuerto`, `VigiaCancelacion`, firmas de `ConstructorImagenPuerto`, `ClonadorRepositorio` y `ColaConstruccionPuerto` → `clases-unificado.mmd`; transición `cancelado` ya en el diagrama de estados.

## Risks / Trade-offs

- **Carrera cancelar / terminar:** si el build termina justo antes de ver la señal, el pipeline revisa la cancelación antes de `PasoEjecucion` y corta igual; si ya pasó a Aprovisionando, la API ya respondió 409.
- **Imagen a medias:** `docker build` cortado no etiqueta la imagen; no hay nada que borrar salvo la carpeta clonada.
