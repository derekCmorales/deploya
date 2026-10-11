# Proposal

Change: `feat/m4-acciones-despliegue`. Módulo dueño: **construccion (M4)** — Derek. Spec tocada: `motor-construccion`. Historia: **M4-02** Cancelar, reintentar y redesplegar (3 pts, Avance 3). Pantallas 12 (Cancelar), 12c (Reintentar) y 14 (Redesplegar, Reintentar).

## Why

Un despliegue lanzado por error no se puede parar, uno que falló por algo pasajero obliga a tocar el repositorio para volver a intentarlo y no hay forma de volver a construir un commit anterior. El contrato v2 ya reserva las tres rutas.

## What Changes

- `POST /despliegues/:id/cancelar` → 200 `{ estado: "cancelado" }`. Desde Encolado quita el trabajo de la cola; desde Construyendo o Revirtiendo marca la cancelación y el trabajador corta `docker build` (o el arranque) en menos de 5 s. Desde Aprovisionando en adelante → 409 `ya-no-se-puede-cancelar`.
- `POST /despliegues/:id/reintentar` → 201 `{ id, numero, estado }`: solo desde Fallido; despliegue nuevo con el **mismo commit** y `disparador = reintento`. Consume una construcción.
- `POST /proyectos/:id/redespliegues` `{ commitSha }` → 201: despliegue nuevo que clona ese commit (`git checkout <sha>`) y **reconstruye**; `disparador = redespliegue`. Consume una construcción. El commit tiene que haber sido desplegado antes en ese proyecto (`commit-desconocido` → 409).
- Las tres pasan por `BloqueosService.verificar` (M5-03) salvo cancelar.
- Web (Derek): «Cancelar» en 12 mientras está Encolado o Construyendo; «Reintentar» en 12c; «Redesplegar» y «Reintentar» por fila en 14 (las monta la pantalla de `feat-m7-resumen-historial`).

## Non-goals

- Revertir sin reconstruir: es M5-04 (`feat-m5-reversion-instantanea`).
- Cancelar después de Aprovisionando (la conmutación ya está en marcha).
- Redesplegar un commit que nunca se desplegó en el proyecto.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `motor-construccion`: «Acciones sobre despliegues» con cancelar (desde cada estado), reintentar y redesplegar, y la diferencia con revertir.

## Impact

- Código: `construccion/acciones/` (`AccionesDespliegueService`, controlador), `CancelacionesPuerto` (Redis y memoria), `ConstructorImagenPuerto.construir` acepta `AbortSignal`, `ClonadorRepositorio.clonar` acepta `commitSha`, `ColaConstruccionPuerto.quitar(id)`.
- Contrato: `docs/contratos/despliegues.md` v3 (código `ya-no-se-puede-cancelar`, `commit-desconocido`).
- Sin cambios de tablas: `disparador` ya tiene `reintento` y `redespliegue`.
