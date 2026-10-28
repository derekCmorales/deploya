# Design

## Context

WEB-02 (Avance 3) dejó `ErrorConexionApi`, `PaginaInexistente`, `SinPermisos` y `EsqueletoProyectos` en `components/estados`, pero solo se usan cuando un `fetch` falla. Un error de render no tiene límite (`error.tsx`) y Next muestra su pantalla genérica en producción.

## Decisions

### 1. Convenciones de Next, no un `ErrorBoundary` propio

`error.tsx`, `global-error.tsx` y `loading.tsx` son las piezas del App Router; no hace falta código propio para capturar errores.

### 2. Reusar los estados que ya existen

Ningún componente nuevo: `ErrorConexionApi` (con `reset` como acción de «Reintentar»), `EsqueletoProyectos` y `Skeleton`.

### 3. Cabeceras en `next.config.ts`

`headers()` aplica a todas las rutas sin middleware. Traefik ya fuerza HTTPS y HSTS en el VPS (ADR 0007), así que aquí no se repite HSTS.

### 4. Accesibilidad: solo lo pequeño

Solo se corrige lo que se arregla con un atributo o un token existente. Lo demás queda «Pendiente» en la tabla de DOC-02.

## Diseño: SOLID y patrones

| Pieza | Patrón | Principio | Por qué |
|---|---|---|---|
| `error.tsx` por grupo | Error Boundary (convención de Next) | S | Un fallo queda en su grupo y el shell sigue en pie |
| `ErrorConexionApi`, `EsqueletoProyectos` | Composite (reuso del design system) | O | Estados nuevos sin componentes nuevos |
| `headers()` en `next.config.ts` | Configuración declarativa | S | La seguridad de transporte no se mezcla con las pantallas |

Sin cambios de clases ni puertos de la API: `clases-unificado.mmd` no cambia.

## Risks / Trade-offs

- `X-Frame-Options: DENY` impide mostrar la web dentro de un iframe; nadie lo necesita.
