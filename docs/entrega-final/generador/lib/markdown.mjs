// Markdown → HTML del cuerpo de un documento. Mantiene la sintaxis que GitHub
// ya muestra bien (bloques mermaid, avisos `> [!NOTE]`, tablas) para que el .md
// se lea en el repo y el PDF salga del mismo texto.
import { readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { Marked } from "marked";
import { aplicarEstilos, separarTitulo } from "./tema-mermaid.mjs";

const AVISOS = {
  NOTE: { clase: "nota", titulo: "Nota" },
  TIP: { clase: "consejo", titulo: "Consejo" },
  IMPORTANT: { clase: "importante", titulo: "Importante" },
  WARNING: { clase: "aviso", titulo: "Atención" },
  CAUTION: { clase: "cuidado", titulo: "Cuidado" },
};

const TIPOS_IMAGEN = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml" };

/**
 * Convierte un documento. `directivas` reemplaza comentarios `<!-- nombre -->`
 * por Markdown generado (p. ej. el diccionario de datos).
 */
export function renderizarDocumento({ rutaMd, estilosDiagrama, directivas = {} }) {
  const fuente = expandirDirectivas(readFileSync(rutaMd, "utf8"), directivas);
  const contexto = { figuras: 0, tablas: 0, encabezados: [], titulo: null, base: dirname(rutaMd) };
  const marked = new Marked({ gfm: true, renderer: rendererCon(contexto, estilosDiagrama) });
  const html = marked.parse(sinTituloPrincipal(fuente, contexto));
  return { html, encabezados: contexto.encabezados, titulo: contexto.titulo };
}

function expandirDirectivas(texto, directivas) {
  return texto.replace(/<!--\s*([\w-]+)\s*-->/g, (original, nombre) =>
    directivas[nombre] ? directivas[nombre]() : original,
  );
}

/** El `# Título` va en la portada, no en el cuerpo. */
function sinTituloPrincipal(texto, contexto) {
  return texto.replace(/^# (.+)\n/m, (_, titulo) => {
    contexto.titulo = titulo.trim();
    return "";
  });
}

function rendererCon(contexto, estilosDiagrama) {
  const slugs = new Map();
  return {
    heading({ tokens, depth, text }) {
      const contenido = this.parser.parseInline(tokens);
      const id = slugUnico(text, slugs);
      if (depth === 2 || depth === 3) contexto.encabezados.push({ nivel: depth, id, texto: textoPlano(contenido) });
      return `<h${depth} id="${id}">${contenido}</h${depth}>\n`;
    },
    code({ text, lang }) {
      if (lang === "mermaid") return figuraDiagrama(text, contexto, estilosDiagrama);
      const clase = lang ? ` class="lenguaje-${lang}"` : "";
      return `<pre${clase}><code>${escapar(text)}</code></pre>\n`;
    },
    blockquote({ tokens }) {
      const aviso = avisoDe(tokens);
      const cuerpo = this.parser.parse(tokens);
      if (!aviso) return `<blockquote>${cuerpo}</blockquote>\n`;
      const limpio = cuerpo.replace(/\[!\w+\]\s*(<br>)?\s*/, "");
      return `<aside class="aviso aviso-${aviso.clase}"><p class="aviso-titulo">${aviso.titulo}</p>${limpio}</aside>\n`;
    },
    table(token) {
      contexto.tablas += 1;
      const esFicha = token.header.every((celda) => !celda.text.trim());
      const encabezado = token.header.map((celda, i) => celdaHtml(this, celda, "th", token.align[i])).join("");
      const filas = token.rows
        .map((fila) => `<tr>${fila.map((celda, i) => celdaHtml(this, celda, "td", token.align[i], esFicha)).join("")}</tr>`)
        .join("\n");
      const cabecera = esFicha ? "" : `<thead><tr>${encabezado}</tr></thead>`;
      return `<div class="tabla${esFicha ? " ficha" : ""}"><table>${cabecera}<tbody>${filas}</tbody></table></div>\n`;
    },
    image({ href, title, text }) {
      contexto.figuras += 1;
      const pie = title ?? text;
      const fuente = incrustarImagen(href, contexto.base);
      return `<figure class="captura"><img src="${fuente}" alt="${escapar(text)}"><figcaption><span class="figura-numero">Figura ${contexto.figuras}.</span> ${escapar(pie)}</figcaption></figure>`;
    },
  };
}

function figuraDiagrama(fuente, contexto, estilosDiagrama) {
  contexto.figuras += 1;
  const { titulo, cuerpo } = separarTitulo(fuente);
  const estilizado = aplicarEstilos(cuerpo, estilosDiagrama);
  const pie = titulo ? ` ${escapar(titulo)}` : "";
  return `<figure class="diagrama"><pre class="mermaid">${escapar(estilizado)}</pre><figcaption><span class="figura-numero">Figura ${contexto.figuras}.</span>${pie}</figcaption></figure>\n`;
}

const LARGO_MAXIMO_SIN_CORTE = 12;
const INICIO_DE_PASO = /(?:^|\s)(?=\d+[a-z]?\.\s)/;

function celdaHtml(renderer, celda, etiqueta, alineacion, esFicha = false) {
  const estilo = alineacion ? ` style="text-align:${alineacion}"` : "";
  const corta = celda.text.trim().length <= LARGO_MAXIMO_SIN_CORTE ? ' class="sin-corte"' : "";
  const html = renderer.parser.parseInline(celda.tokens);
  return `<${etiqueta}${estilo}${corta}>${esFicha ? pasosEnLineas(html) : html}</${etiqueta}>`;
}

/** En una ficha de caso de uso, «1. … 2. … 2a. …» se muestra un paso por línea. */
function pasosEnLineas(html) {
  const pasos = html.split(INICIO_DE_PASO).filter(Boolean);
  if (pasos.length < 2) return html;
  return `<ol class="pasos">${pasos
    .map((paso) => {
      const [, numero, texto] = paso.trim().match(/^(\d+[a-z]?)\.\s([\s\S]*)$/) ?? [null, "", paso];
      return `<li><span class="paso">${numero}</span><span>${texto}</span></li>`;
    })
    .join("")}</ol>`;
}

function avisoDe(tokens) {
  const primero = tokens[0]?.raw ?? "";
  const tipo = primero.match(/^\[!(\w+)\]/)?.[1];
  return tipo ? AVISOS[tipo] : null;
}

function incrustarImagen(href, base) {
  if (/^(https?:|data:)/.test(href)) return href;
  const ruta = resolve(base, href);
  const tipo = TIPOS_IMAGEN[extname(ruta).toLowerCase()] ?? "application/octet-stream";
  return `data:${tipo};base64,${readFileSync(ruta).toString("base64")}`;
}

function slugUnico(texto, usados) {
  const base =
    texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/<[^>]+>|`/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-") || "seccion";
  const veces = usados.get(base) ?? 0;
  usados.set(base, veces + 1);
  return veces ? `${base}-${veces}` : base;
}

const textoPlano = (html) => html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

export const escapar = (texto) =>
  String(texto).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
