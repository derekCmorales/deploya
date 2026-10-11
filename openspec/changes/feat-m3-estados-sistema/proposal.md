# Proposal

Change: `feat/m3-estados-sistema`. Módulo: **proyectos (M3)** y transversal web — Eduardo. Spec tocada: `proyectos`. Historia: **WEB-02** Estados del sistema y banner de vencida (2 pts, Avance 3). Pantallas 10c y 28 (404, error de API y carga).

## Why

La lista de proyectos no avisa cuando la suscripción venció (el bloqueo existe en la API, pero el cliente se entera al pulsar «Desplegar»), el 404 es el del andamiaje y un fallo de red deja la pantalla en blanco. Son estados que cualquier recorrido de la demo puede tocar.

## What Changes

- **10c:** en `/projects`, si `GET /suscripciones/mia` dice `vencida`, `Banner warn` «Tu plan Starter venció el 24 sep · despliegues bloqueados» con la fecha fin de la gracia, «Ver suscripción» y «Renovar»; «Nuevo proyecto» y «Desplegar» deshabilitados. Reusa `banner-bloqueo.tsx` de 11d y 17.
- **28 · 404:** `app/not-found.tsx` con el diseño de 28 (ruta pedida, «Ir a proyectos», «Volver»).
- **28 · Error de conexión con la API:** `ErrorApi` con «Reintentar ahora» y reintento automático (8 s, 16 s, 30 s); se usa en la lista de proyectos y en el layout del proyecto.
- **28 · Carga:** esqueleto de la lista de proyectos con `Skeleton`.
- 403 y «Sesión expirada» ya están (M1-04, Eddy); «Suscripción suspendida» es de Javier (M2-05).

## Non-goals

- Otras pantallas de error por módulo.
- Cambiar la lógica de bloqueo (es de M5-03).

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `proyectos`: «Límite y estado de la suscripción» con el aviso de la lista y los estados de error y carga del panel.

## Impact

- Web: `app/(projects)/projects/page.tsx` y `_componentes/`, `app/not-found.tsx`, `components/estados/error-api.tsx`, `components/estados/esqueleto-proyectos.tsx`; `lib/reintento.ts`, `lib/gracia.ts`.
- Sin cambios de API.
