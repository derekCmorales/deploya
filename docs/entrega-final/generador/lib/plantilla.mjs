// Arma el HTML completo de un documento: portada, control, índice y cuerpo.
// Recibe todo como datos (Facade sobre tokens, fuentes y contenido): no lee archivos
// del producto ni decide qué documento es; eso lo hace construir.mjs.
import { escapar } from "./markdown.mjs";

/**
 * @param {object} p
 * @param {object} p.documento   Entrada del catálogo (numero, etiqueta, subtitulo…)
 * @param {object[]} p.catalogo  Los cuatro documentos, para el riel de la portada
 * @param {object} p.entrega     Datos del curso y del equipo (entrega.json)
 * @param {object} p.contenido   { html, encabezados, titulo } de markdown.mjs
 * @param {object} p.recursos    { css, tokensCss, tokens, fuentes, mermaidJs, temaMermaid, paginas }
 */
export function armarHtml({ documento, catalogo, entrega, contenido, recursos }) {
  const titulo = contenido.titulo ?? documento.titulo;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapar(`${titulo} · Deploya`)}</title>
<style>
${recursos.tokensCss}
${reglasDePagina(recursos.tokens, titulo)}
${fuentesCss(recursos.fuentes)}
${recursos.css}
</style>
</head>
<body>
${portada({ documento, catalogo, entrega, titulo })}
${preliminar({ documento, entrega, contenido, paginas: recursos.paginas })}
<main class="cuerpo">
${contenido.html}
</main>
${recursos.mermaidJs ? scriptMermaid(recursos.mermaidJs, recursos.temaMermaid) : ""}
</body>
</html>`;
}

function reglasDePagina(tokens, titulo) {
  const margen = (posicion, contenido, extra) =>
    `@${posicion} { content: ${contenido}; ${extra} }`;
  const texto = (peso, tamano, familia, color) => `font: ${peso} ${tamano}/1 ${familia}; color: ${color};`;
  const arriba = "vertical-align: bottom; padding-bottom: 5mm;";
  const abajo = "vertical-align: top; padding-top: 5mm;";
  return `
@page {
  size: A4;
  margin: 22mm 18mm 20mm 18mm;
  background: ${tokens.background};
  ${margen("top-left", '"deploya"', `${texto(700, "9.5pt", '"Geist", sans-serif', tokens.foreground)} letter-spacing: -0.06em; ${arriba}`)}
  ${margen("top-right", JSON.stringify(titulo), `${texto(500, "7.5pt", '"Geist Mono", monospace', tokens["muted-foreground"])} ${arriba}`)}
  ${margen("bottom-left", '"Proyecto final · Ingeniería de Software I · 2026"', `${texto(400, "7.5pt", '"Geist", sans-serif', tokens.faint)} ${abajo}`)}
  ${margen("bottom-right", 'counter(page) " / " counter(pages)', `${texto(500, "7.5pt", '"Geist Mono", monospace', tokens["muted-foreground"])} ${abajo}`)}
}
@page portada {
  margin: 0;
  @top-left { content: none; } @top-right { content: none; }
  @bottom-left { content: none; } @bottom-right { content: none; }
}
@page apaisada { size: A4 landscape; margin: 18mm 18mm 16mm; background: ${tokens.background}; }
html, body { background: ${tokens.background}; }`;
}

const fuentesCss = ({ geist, geistMono }) => `
@font-face { font-family: "Geist"; src: url(data:font/woff2;base64,${geist}) format("woff2"); font-weight: 100 900; }
@font-face { font-family: "Geist Mono"; src: url(data:font/woff2;base64,${geistMono}) format("woff2"); font-weight: 100 900; }`;

function wordmark() {
  return `<span class="wordmark">deploy<span class="a-senal">a</span></span>`;
}

function portada({ documento, catalogo, entrega, titulo }) {
  const riel = catalogo
    .map(
      (d) => `<div class="riel-etapa${d.id === documento.id ? " actual" : ""}">
  <span class="num">${String(d.numero).padStart(2, "0")}</span><b>${escapar(d.corto)}</b>${escapar(d.alcance)}
</div>`,
    )
    .join("\n");
  const equipo = entrega.equipo
    .map((p) => `<li><b>${escapar(p.nombre)}</b><span>${escapar(p.papel)}</span></li>`)
    .join("");
  return `<section class="portada">
  ${wordmark()}
  <p class="portada-etiqueta">Documento ${documento.numero} de ${catalogo.length} · ${escapar(documento.etiqueta)}</p>
  <h1>${escapar(titulo)}</h1>
  <p class="portada-subtitulo">${escapar(documento.subtitulo)}</p>
  <div class="riel">${riel}</div>
  <div class="portada-pie">
    <dl>
      <dt>Institución</dt><dd>${escapar(entrega.facultad)}<br>${escapar(entrega.carrera)}</dd>
      <dt>Curso</dt><dd>${escapar(entrega.curso)}</dd>
      <dt>Entrega</dt><dd>${escapar(entrega.entrega)}</dd>
      <dt>Repositorio</dt><dd><code>${escapar(entrega.repositorio)}</code></dd>
    </dl>
    <div class="equipo">
      <p class="equipo-titulo">Equipo</p>
      <ul>${equipo}</ul>
    </div>
  </div>
</section>`;
}

function preliminar({ documento, entrega, contenido, paginas }) {
  const filas = [
    ["Versión", entrega.version],
    ["Fecha", entrega.fecha],
    ["Estado", entrega.estado],
    ["Fuente", `docs/entrega-final/${documento.archivo}`],
  ]
    .map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${escapar(dd)}</dd></div>`)
    .join("");
  return `<section class="preliminar">
  <dl class="control">${filas}</dl>
  <p class="indice-titulo">Contenido</p>
  <ol class="indice">${indice(contenido.encabezados, paginas)}</ol>
</section>`;
}

function indice(encabezados, paginas = {}) {
  let capitulo = 0;
  let seccion = 0;
  return encabezados
    .map(({ nivel, id, texto }) => {
      if (nivel === 2) {
        capitulo += 1;
        seccion = 0;
      } else seccion += 1;
      const numero = nivel === 2 ? String(capitulo).padStart(2, "0") : `${capitulo}.${seccion}`;
      const pagina = paginas[id] ?? "";
      return `<li class="n${nivel}"><span class="numero">${numero}</span><a href="#${id}">${escapar(texto)}</a><span class="relleno"></span><span class="pagina">${pagina}</span></li>`;
    })
    .join("\n");
}

function scriptMermaid(mermaidJs, tema) {
  return `<script>${mermaidJs}</script>
<script>
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: ${JSON.stringify(tema)},
    flowchart: { htmlLabels: true, curve: "basis", padding: 14, nodeSpacing: 38, rankSpacing: 46, wrappingWidth: 260 },
    sequence: { showSequenceNumbers: false, mirrorActors: false, actorMargin: 46, messageFontFamily: "Geist", noteFontFamily: "Geist", actorFontFamily: "Geist" },
    er: { layoutDirection: "TB", minEntityWidth: 120, fontSize: 12 },
    class: { padding: 8 },
    state: { padding: 8 },
    securityLevel: "loose",
  });
  document.fonts.ready
    .then(() => mermaid.run({ querySelector: "pre.mermaid" }))
    .catch((error) => { window.__errorMermaid = String(error && error.message || error); })
    .finally(() => { window.__listo = true; });
</script>`;
}
