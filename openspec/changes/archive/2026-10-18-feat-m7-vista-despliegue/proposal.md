# Proposal

Change: `feat/m7-vista-despliegue`. Módulo dueño: **observabilidad (M7)** — Eduardo; datos de **motor-construccion (M4)** — Derek. Specs tocadas: `observabilidad`, `motor-construccion`. Historia: **M7-01** vista de despliegue: riel de etapas y bitácora (5 pts), Avance 2. Pantallas 12, 12b y 12c. Contrato: [despliegues.md](../../../docs/contratos/despliegues.md) v2.1.

## Why

En el Avance 1 el estado del despliegue solo se ve como una insignia y un riel de 55 px en la lista (10). El recorrido del Avance 2 pide **ver el despliegue en el riel de cinco etapas con su bitácora en vivo**, y la retroalimentación de la entrega 1 pidió hacer visible la detección de stack: la bitácora es donde se lee «Stack detectado». El motor ya guarda etapas, duraciones y líneas (M4-01); falta la pantalla.

## What Changes

- **Ruta** `/projects/[proyecto]/despliegues/[n]` (`n` = número del despliegue), con el layout del proyecto (cabecera y pestañas de 13–19; Resumen y Despliegues muestran «llega en el Avance 3» hasta M7-02).
- **12 · en curso:** cabecera con versión, commit, autor, rama y tiempo transcurrido; `RielEtapas` grande con duración por etapa; `Bitacora` numerada que pide `GET /despliegues/:id/bitacora?desde=` cada 3 s y se detiene cuando `terminado = true`; «Copiar» copia la bitácora completa.
- **12b · Saludable:** URL pública con «Visitar», digest e imagen, receta (`dockerfile` o stack detectado), recursos aplicados y «#n−1 detenido» si hubo conmutación.
- **12c · Fallido:** línea del error resaltada, `codigoSalida` y `motivoFallo`; aviso «La versión #k sigue sirviendo tráfico» si hay una activa.
- **Navegación:** «Desplegar» (11d) y una fila de 10 llevan a 12.
- **Motor (Derek):** `GET /proyectos/:id/despliegues/:numero` → mismo cuerpo que `GET /despliegues/:id` (contrato v2.1). Sin él, la URL tendría que llevar el id interno.

## Non-goals

- «Cancelar despliegue» (M4-02, Avance 3): el botón no se muestra todavía.
- Resumen e historial del proyecto (M7-02, Avance 3).
- WebSocket o SSE: se queda en polling ([ADR 0006](../../../docs/adr/0006-polling-en-vez-de-websocket.md)).

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `observabilidad`: «Vista de despliegue» con escenarios de Saludable, copiar y fin del polling.
- `motor-construccion`: nueva «Consulta por número de despliegue».

## Impact

- Web: `app/(projects)/projects/[proyecto]/layout.tsx`, `despliegues/[n]/page.tsx`, `hooks/use-bitacora.ts`, funciones puras en `lib/despliegues.ts`.
- API (Derek): una ruta en `DesplieguesController` y `RepositorioDespliegues.porNumero(proyectoId, numero)`.
- Sin cambios de schema.
