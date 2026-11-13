# Sitio de la documentación

Los cuatro documentos de Deploya (requisitos, diseño, manual técnico y manual de usuario) en HTML y PDF, con el design system v4.1. Es un sitio estático: Cloudflare Pages lo sirve tal cual, sin paso de construcción.

| Ruta | Qué es |
|---|---|
| `index.html` | Portada con los cuatro documentos, sus PDF y lo que cambió |
| `doc/*.html` | Cada documento (estilos de pantalla y de impresión en el mismo archivo) |
| `doc/img/` | Capturas del manual de usuario |
| `pdf/*.pdf` | Los PDF que se entregan; se generan desde `doc/*.html` |
| `assets/fuentes/` | Geist y Geist Mono |
| `_headers` | Cabeceras de seguridad y caché de Cloudflare Pages |

## Editar y volver a generar

1. Edita el HTML de `doc/`. Los títulos `h2` y `h3` numeran solos; el índice se regenera.
2. Si cambió un `.mmd` de `docs/diagramas/`, redibújalo en los documentos que lo usan (buscan la marca `<!-- diagrama: … -->`):

   ```bash
   npm install --prefix scripts/docs-sitio
   npx --prefix scripts/docs-sitio playwright install chromium
   node scripts/docs-sitio/diagramas.mjs docs/sitio/doc/02-deploya-diseno.html docs/diagramas/compartido/erd-unificado.mmd
   ```

3. Genera los PDF y el índice con números de página reales (necesita `pdftotext`, del paquete `poppler-utils`):

   ```bash
   node scripts/docs-sitio/construir.mjs              # los cuatro
   node scripts/docs-sitio/construir.mjs diseno       # solo uno
   ```

## Publicar en Cloudflare Pages

Una sola vez, en el panel de Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**, el repositorio `derekCmorales/deploya` y:

| Campo | Valor |
|---|---|
| Production branch | `main` |
| Framework preset | None |
| Build command | *(vacío)* |
| Build output directory | `docs/sitio` |

Después, **Custom domains → Set up a custom domain → `docs.deploya.larasolutions.dev`**. Como la zona ya está en Cloudflare, el registro CNAME se crea solo y tiene prioridad sobre el comodín `*.deploya.larasolutions.dev` que apunta a la EC2. El subdominio `docs` está reservado en la API (`SUBDOMINIOS_DE_PLATAFORMA`), así que ningún proyecto puede tomarlo.

Cada push a `main` que toque `docs/sitio/` vuelve a publicar el sitio.
