# Design

## Context

WEB-02 (Avance 3) dejó `ErrorConexionApi`, `PaginaInexistente`, `SinPermisos` y `EsqueletoProyectos` en `components/estados`, pero solo se usan cuando un `fetch` falla. Un error de render no tiene límite (`error.tsx`) y Next muestra su pantalla genérica en producción.

## Decisions

### 1. Convenciones de Next, no un `ErrorBoundary` propio

`error.tsx`, `global-error.tsx` y `loading.tsx` son las piezas del App Router; no hace falta código propio para capturar errores.

### 2. Reusar los estados que ya existen

Ningún estado visual nuevo: `ErrorConexionApi` (con `reset` como acción de «Reintentar»), `EsqueletoProyectos` y `Skeleton`.

### 3. Cabeceras en `next.config.ts`

`headers()` aplica a todas las rutas sin middleware. Traefik ya fuerza HTTPS y HSTS en el VPS (ADR 0007), así que aquí no se repite HSTS.

### 4. Accesibilidad: solo lo pequeño

Solo se corrige lo que se arregla con un atributo o un token existente. Lo demás queda «Pendiente» en la tabla de DOC-02.

### 5. Un adaptador para el contrato de `error.tsx`

`error.tsx` recibe `error` y `reset`, no un `ErrorApi`. `ErrorDePantalla` (cliente) adapta ese contrato al estado 28 y los siete límites quedan de una línea. No es un estado visual nuevo: `ErrorConexionApi` gana tres props opcionales con sus valores actuales por defecto (`titulo`, `descripcion`, `reintentoAutomatico`), porque un fallo de render no es un fallo de conexión y no debe mostrar «Reintentamos solos» ni entrar en un bucle de reintento. Con `reintentoAutomatico={false}` la acción dice «Reintentar» y no se dibuja la línea de reintento.

`global-error.tsx` sustituye el layout raíz: importa `globals.css` y dibuja su propio `html`/`body`, sin shell ni tema. Es el único que no queda «dentro del shell».

### 6. Títulos: la portada es la excepción

`title.template` se aplica a los segmentos hijos del layout, no a `app/page.tsx`, que comparte segmento con él. La portada compone su título con `tituloDePagina("Inicio")`; el resto de páginas declara solo su nombre. `app/icon.svg` no puede leer variables CSS: usa los valores exactos de `tokens.json` (`background`, `foreground` y `signal` en claro) con un comentario que los ata al token.

## Diseño: SOLID y patrones

| Pieza | Patrón | Principio | Por qué |
|---|---|---|---|
| `error.tsx` por grupo | Error Boundary (convención de Next) | S | Un fallo queda en su grupo y el shell sigue en pie |
| `ErrorDePantalla` | Adapter (contrato de Next → estado 28) | S, D | Los límites no repiten la copia ni conocen el design system |
| `ErrorConexionApi`, `EsqueletoProyectos` | Composite (reuso del design system) | O | Estados nuevos sin componentes nuevos |
| `titulos.ts` | Configuración declarativa | S | La plantilla y su composición se prueban sin navegador |
| `headers()` en `next.config.ts` | Configuración declarativa | S | La seguridad de transporte no se mezcla con las pantallas |

Sin cambios de clases ni puertos de la API: `clases-unificado.mmd` no cambia.

## Risks / Trade-offs

- `X-Frame-Options: DENY` impide mostrar la web dentro de un iframe; nadie lo necesita.
