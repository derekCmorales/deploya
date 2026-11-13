// Genera los cuatro PDF de docs/sitio/pdf y numera el índice de cada documento con sus páginas reales.
// Uso (desde la raíz del repo): node scripts/docs-sitio/construir.mjs [requisitos|diseno|manual-tecnico|manual-usuario]
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import path from "node:path";

const { chromium } = createRequire(import.meta.url)("playwright");
const DOCUMENTOS = ["01-deploya-requisitos", "02-deploya-diseno", "03-deploya-manual-tecnico", "04-deploya-manual-usuario"];
const SITIO = path.resolve("docs/sitio");

async function imprimir(navegador, nombre) {
  const pagina = await navegador.newPage();
  await pagina.goto(`file://${SITIO}/doc/${nombre}.html`, { waitUntil: "load" });
  await pagina.evaluate(() => document.fonts.ready);
  const pdf = `${SITIO}/pdf/${nombre}.pdf`;
  await pagina.pdf({ path: pdf, preferCSSPageSize: true, printBackground: true });
  await pagina.close();
  return pdf;
}

async function main() {
  const filtro = process.argv[2];
  const elegidos = DOCUMENTOS.filter((d) => !filtro || d.endsWith(filtro));
  const navegador = await chromium.launch();
  for (const nombre of elegidos) {
    const html = `${SITIO}/doc/${nombre}.html`;
    const borrador = await imprimir(navegador, nombre);
    execFileSync("python3", ["scripts/docs-sitio/indice.py", html, borrador], { stdio: "inherit" });
    await imprimir(navegador, nombre);
    console.log(`listo: docs/sitio/pdf/${nombre}.pdf`);
  }
  await navegador.close();
}

await main();
