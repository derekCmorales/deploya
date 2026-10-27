# Design

## Context

`Bitacora` ya muestra líneas numeradas con `enCurso`; el polling ya existe en la vista de despliegue.

## Decisions

### 1. Leer, no guardar

`docker logs` es la fuente; no hay tabla nueva.

### 2. Nivel por heurística

Se detecta por prefijo (`ERROR`, `ERR`, `FATAL`, `PANIC` → error; `WARN`, `WARNING` → aviso); lo demás es Info.

### 3. La API pide y el trabajador lee (petición y respuesta por BullMQ)

La API no tiene docker.sock (ADR 0002). `SalidaContenedorBullMq` encola `{ contenedorId, desde, max }` en la cola `bitacoras` y espera el resultado con `waitUntilFinished` (máx. 2,5 s, menos que el sondeo de 3 s). El trabajador la consume con concurrencia 4 y responde con `ContenedorPuerto.bitacora`. El trabajo se borra al terminar (`removeOnComplete`, `removeOnFail`): nada queda en Redis ni en la base. Si el trabajador no responde, `BitacoraNoDisponible` → 503 y la web sigue consultando.

### 4. `desde` estricto

Docker filtra `since` por segundo; `lineasEjecucion` descarta lo que no es estrictamente posterior a `desde` para que una línea no llegue dos veces. La web numera, guarda las últimas 500 y aparta lo que llega en pausa (`recibirLineas`, `pausar`, `reanudar`: puras).

## Diseño: SOLID y patrones

| Clase / puerto | Patrón | Principio | Por qué |
|---|---|---|---|
| `ContenedorPuerto.bitacora` | Adapter | I, D | Método nuevo en el puerto |
| `nivelDe(linea)` | Función pura | S | Se prueba sin Docker |
| `SalidaContenedorPuerto` / `SalidaContenedorBullMq` | Adapter (petición y respuesta) | D, L | M7 no sabe que hay una cola; la memoria y BullMQ cumplen el mismo contrato |
| `BitacoraEjecucionService` | Service Layer | S | Dueño, despliegue activo y lectura; nada de HTTP ni Docker |

Cambios de clases y puertos: `ContenedorPuerto.bitacora`, `SalidaContenedorPuerto`, `BitacoraEjecucionService` → `docs/diagramas/compartido/clases-unificado.mmd` en el mismo PR (`pnpm diagramas:sync`).

## Risks / Trade-offs

- **Contenido no confiable:** se muestra solo como texto (regla de `Bitacora`).
