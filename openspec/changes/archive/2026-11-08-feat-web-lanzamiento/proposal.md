# Proposal

Change: `feat/web-lanzamiento`. Módulo dueño: **apps/web (M3, M7)** — Eduardo. Specs tocadas: `proyectos`. Historia: **EST-01c (2 pts)** (entrega final, [plan-avances.md § Entrega final](../../../docs/plan-avances.md#entrega-final--100--entrega-y-exposición-viernes-6-de-noviembre)). Pantallas: 10c, 28 y todas las de la demo (accesibilidad).

## Why

La web sale al público. Hoy no hay límite de error de React (`error.tsx`): un fallo inesperado en una pantalla deja la página en blanco. Tampoco hay estado de carga entre rutas, cabeceras de seguridad, ni título por página o ícono para la pestaña y los enlaces compartidos.

## What Changes

- `error.tsx` en la raíz y en cada grupo (`(auth)`, `(billing)`, `(cuenta)`, `(projects)`, `(admin)`) y `global-error.tsx`, todos con `ErrorConexionApi` y «Reintentar» (`reset()`).
- `loading.tsx` en `(projects)` con `EsqueletoProyectos` y en los demás grupos con `Skeleton`.
- Cabeceras en `next.config.ts`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` sin cámara, micrófono ni ubicación.
- `metadata` con `title.template: "%s · Deploya"`, título por página, `openGraph` y `app/icon.svg` con el `Wordmark` del design system.
- Correcciones pequeñas de accesibilidad de la tabla de DOC-02 (la escribe Derek): `aria-label`, foco visible y contraste, solo con tokens.

## Non-goals

- CSP estricta con nonces.
- Pantallas o componentes nuevos.
- Rediseño de cualquier pantalla.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `proyectos`: «Web lista para el público» (requisito nuevo, junto a los estados de «Límite y estado de la suscripción»).

## Impact

- Web: `app/**/error.tsx`, `app/**/loading.tsx`, `app/global-error.tsx`, `app/icon.svg`, `layout.tsx`, `next.config.ts` y las correcciones de accesibilidad.
- API y datos: ninguno.
