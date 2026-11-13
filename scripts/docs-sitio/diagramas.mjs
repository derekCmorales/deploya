// Redibuja en un documento de docs/sitio/doc los diagramas Mermaid marcados con
// `<!-- diagrama: <ruta.mmd> -->`, con el tema claro del design system v4.1.
// Uso: node scripts/docs-sitio/diagramas.mjs <doc.html> <ruta.mmd>...   (desde la raíz del repo)
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const requerir = createRequire(import.meta.url);
const { chromium } = requerir("playwright");
const MERMAID = requerir.resolve("mermaid/dist/mermaid.min.js");
const TEMA = {
  fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif",
  fontSize: "14px",
  primaryColor: "#fefdfb",
  primaryBorderColor: "#a5a09a",
  primaryTextColor: "#1a1510",
  lineColor: "#5e5852",
  clusterBkg: "#f2efe9",
  clusterBorder: "#cecbc6",
  secondaryColor: "#ece9e4",
  tertiaryColor: "#ece9e4",
  textColor: "#1a1510",
  edgeLabelBackground: "#fefdfb",
  mainBkg: "#fefdfb",
  nodeBorder: "#a5a09a",
};
const ESTILO_SVG = 'style="max-width: 100%; max-height: 500px;"';

function tituloDe(fuente) {
  return (fuente.match(/^---\ntitle:\s*(.+)\n---/) || [])[1];
}

function conTitulo(html, desde, titulo) {
  const inicio = html.indexOf("<figcaption>", desde);
  const fin = html.indexOf("</figcaption>", inicio);
  const numero = html.slice(inicio, fin).match(/<span class="figura-numero">[^<]*<\/span>/);
  if (!titulo || !numero) return html;
  return html.slice(0, inicio) + `<figcaption>${numero[0]} ${titulo}` + html.slice(fin);
}

async function redibujar(pagina, html, ruta) {
  const fuente = fs.readFileSync(ruta, "utf8");
  const marca = `<!-- diagrama: ${ruta} -->`;
  let desde = html.indexOf(marca);
  while (desde !== -1) {
    const inicio = html.indexOf("<svg", desde);
    const fin = html.indexOf("</svg></pre>", inicio) + "</svg>".length;
    const id = `mermaid-${Date.now()}`;
    const { svg } = await pagina.evaluate(([i, t]) => window.mermaid.render(i, t), [id, fuente]);
    const svgFijo = svg.replace(/style="max-width: [\d.]+px;"/, ESTILO_SVG);
    html = conTitulo(html.slice(0, inicio) + svgFijo + html.slice(fin), inicio, tituloDe(fuente));
    desde = html.indexOf(marca, inicio);
  }
  return html;
}

async function main() {
  const [, , documento, ...rutas] = process.argv;
  let html = fs.readFileSync(documento, "utf8");
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();
  await pagina.setContent("<!doctype html><html><body></body></html>");
  await pagina.addScriptTag({ path: MERMAID });
  await pagina.evaluate((tema) => window.mermaid.initialize({ startOnLoad: false, theme: "base", securityLevel: "strict", themeVariables: tema }), TEMA);
  for (const ruta of rutas) html = await redibujar(pagina, html, ruta);
  fs.writeFileSync(documento, html);
  await navegador.close();
  console.log(`${path.basename(documento)}: ${rutas.length} diagrama(s)`);
}

await main();
