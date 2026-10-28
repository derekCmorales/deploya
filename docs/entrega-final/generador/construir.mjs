// Construye la documentación de la entrega final: un PDF y un HTML estático por documento.
// Uso (desde la raíz del repo):
//   npm ci --prefix docs/entrega-final/generador
//   node docs/entrega-final/generador/construir.mjs            → los cuatro
//   node docs/entrega-final/generador/construir.mjs diseno     → solo uno (id del catálogo)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { diccionarioEnMarkdown, leerEsquema } from "./lib/diccionario-datos.mjs";
import { Impresora } from "./lib/impresora.mjs";
import { renderizarDocumento } from "./lib/markdown.mjs";
import { armarHtml } from "./lib/plantilla.mjs";
import { estilosPorPapel, variablesDeTema } from "./lib/tema-mermaid.mjs";
import { leerTokens } from "./lib/tokens.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "../../..");
const DOCUMENTOS = resolve(AQUI, "..");
const RUTAS = {
  globals: join(RAIZ, "apps/web/src/app/globals.css"),
  schema: join(RAIZ, "apps/api/prisma/schema.prisma"),
  css: join(AQUI, "lib/estilos.css"),
  mermaid: join(AQUI, "node_modules/mermaid/dist/mermaid.min.js"),
  geist: join(AQUI, "node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2"),
  geistMono: join(AQUI, "node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2"),
  pdf: join(DOCUMENTOS, "pdf"),
  html: join(DOCUMENTOS, "html"),
};

async function construir(soloId) {
  const { entrega, documentos } = JSON.parse(readFileSync(join(AQUI, "catalogo.json"), "utf8"));
  const elegidos = soloId ? documentos.filter((d) => d.id === soloId) : documentos;
  if (!elegidos.length) throw new Error(`No hay un documento «${soloId}» en catalogo.json`);

  const recursos = cargarRecursos();
  const directivas = { "diccionario-datos": () => diccionarioEnMarkdown(leerEsquema(RUTAS.schema)) };
  mkdirSync(RUTAS.pdf, { recursive: true });
  mkdirSync(RUTAS.html, { recursive: true });

  const impresora = await Impresora.abrir();
  try {
    for (const documento of elegidos) {
      const contenido = renderizarDocumento({
        rutaMd: join(DOCUMENTOS, documento.archivo),
        estilosDiagrama: recursos.estilosDiagrama,
        directivas,
      });
      const html = armarHtml({ documento, catalogo: documentos, entrega, contenido, recursos });
      const pagina = await impresora.preparar(html);
      const paginas = await impresora.paginasDeEncabezados(pagina, contenido.encabezados.map((e) => e.id));
      await impresora.rellenarIndice(pagina, paginas);
      writeFileSync(join(RUTAS.pdf, `${documento.salida}.pdf`), await impresora.pdf(pagina));
      writeFileSync(join(RUTAS.html, `${documento.salida}.html`), await impresora.htmlEstatico(pagina));
      await pagina.close();
      console.log(`✓ ${documento.salida} (${contenido.encabezados.length} secciones)`);
    }
  } finally {
    await impresora.cerrar();
  }
}

function cargarRecursos() {
  const tokens = leerTokens(RUTAS.globals);
  const tokensCss = `:root {\n${Object.entries(tokens).map(([k, v]) => `  --${k}: ${v};`).join("\n")}\n}`;
  return {
    tokens,
    tokensCss,
    css: readFileSync(RUTAS.css, "utf8"),
    fuentes: {
      geist: readFileSync(RUTAS.geist).toString("base64"),
      geistMono: readFileSync(RUTAS.geistMono).toString("base64"),
    },
    mermaidJs: readFileSync(RUTAS.mermaid, "utf8"),
    temaMermaid: variablesDeTema(tokens),
    estilosDiagrama: estilosPorPapel(tokens),
  };
}

construir(process.argv[2]).catch((error) => {
  console.error(error);
  process.exit(1);
});
