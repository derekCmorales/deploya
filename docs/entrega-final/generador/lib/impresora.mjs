// Adapter sobre Chromium (Playwright): renderiza los diagramas, imprime el PDF y
// guarda el HTML estático (con los SVG ya dibujados y sin scripts).
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const ESPERA_DIAGRAMAS_MS = 120_000;
// Un diagrama más ancho que esto ocupa todo el ancho de la figura; uno más chico queda a su tamaño.
// Las cajas son el espacio útil de una figura en A4 vertical y apaisado (px a 96 ppp).
const AJUSTE_DIAGRAMAS = {
  anchoMinimoParaEstirar: 340,
  vertical: { ancho: 620, alto: 775 },
  apaisada: { ancho: 945, alto: 500 },
  // Solo se gira la página si el diagrama gana al menos un 25 % de tamaño.
  gananciaMinima: 1.25,
};
const MARCA = (id) => `QQ${id.replace(/[^a-z0-9]/gi, "")}QQ`;

export class Impresora {
  static async abrir() {
    const navegador = await chromium.launch(
      process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
    );
    return new Impresora(navegador);
  }

  constructor(navegador) {
    this.navegador = navegador;
  }

  /** Dibuja los diagramas y devuelve la página lista para imprimir. */
  async preparar(html) {
    const pagina = await this.navegador.newPage({ viewport: { width: 794, height: 1123 } });
    await pagina.setContent(html, { waitUntil: "load" });
    await pagina.waitForFunction(() => window.__listo === true || !window.mermaid, null, { timeout: ESPERA_DIAGRAMAS_MS });
    const fallo = await pagina.evaluate(() => {
      const pendientes = [...document.querySelectorAll("pre.mermaid")].filter((pre) => !pre.querySelector("svg"));
      return window.__errorMermaid ?? (pendientes.length ? `${pendientes.length} diagramas sin dibujar` : null);
    });
    if (fallo) throw new Error(`Mermaid: ${fallo}`);
    await pagina.evaluate(ajustarDiagramas, AJUSTE_DIAGRAMAS);
    return pagina;
  }

  /**
   * Página de cada encabezado del índice. Pone una marca invisible en cada uno,
   * imprime y busca la marca con `pdftotext`. Sin pdftotext, el índice queda sin números.
   */
  async paginasDeEncabezados(pagina, ids) {
    if (!hayPdftotext()) return {};
    await pagina.evaluate(
      (marcas) => {
        for (const [id, texto] of marcas) {
          const marca = document.createElement("span");
          marca.className = "marca-indice";
          marca.textContent = texto;
          marca.style.cssText = "position:absolute;font-size:5px;line-height:1;color:transparent;white-space:nowrap;";
          document.getElementById(id)?.prepend(marca);
        }
      },
      ids.map((id) => [id, MARCA(id)]),
    );
    const temporal = mkdtempSync(join(tmpdir(), "deploya-indice-"));
    try {
      const pdf = join(temporal, "borrador.pdf");
      writeFileSync(pdf, await this.pdf(pagina));
      const paginas = execFileSync("pdftotext", [pdf, "-"], { encoding: "utf8" }).split("\f");
      const resultado = {};
      for (const id of ids) {
        const indice = paginas.findIndex((texto) => texto.includes(MARCA(id)));
        if (indice >= 0) resultado[id] = indice + 1;
      }
      return resultado;
    } finally {
      rmSync(temporal, { recursive: true, force: true });
      await pagina.evaluate(() => document.querySelectorAll(".marca-indice").forEach((m) => m.remove()));
    }
  }

  /** Escribe los números en el índice; no cambia el alto de ninguna línea. */
  rellenarIndice(pagina, paginas) {
    return pagina.evaluate((paginas) => {
      for (const enlace of document.querySelectorAll(".indice a")) {
        const numero = paginas[enlace.getAttribute("href").slice(1)];
        if (numero) enlace.parentElement.querySelector(".pagina").textContent = String(numero);
      }
    }, paginas);
  }

  pdf(pagina) {
    return pagina.pdf({ preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false, tagged: true, outline: true });
  }

  /** HTML autocontenido para el navegador o un Artifact: SVG ya dibujados, sin scripts. */
  htmlEstatico(pagina) {
    return pagina.evaluate(() => {
      document.querySelectorAll("script").forEach((script) => script.remove());
      return "<!doctype html>\n" + document.documentElement.outerHTML;
    });
  }

  cerrar() {
    return this.navegador.close();
  }
}

function hayPdftotext() {
  try {
    execFileSync("pdftotext", ["-v"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Corre en el navegador: estira los diagramas medianos y grandes al ancho disponible
 * y pasa a una página apaisada los que se leen mucho mejor así (secuencias, C4 nivel 3).
 */
function ajustarDiagramas({ anchoMinimoParaEstirar, vertical, apaisada, gananciaMinima }) {
  const escala = (caja, ancho, alto) => Math.min(caja.ancho / ancho, caja.alto / alto);
  for (const svg of document.querySelectorAll("figure.diagrama svg")) {
    const { width: ancho = 0, height: alto = 0 } = svg.viewBox.baseVal ?? {};
    if (ancho < anchoMinimoParaEstirar || !alto) continue;
    svg.style.maxWidth = "100%";
    svg.setAttribute("width", "100%");
    const figura = svg.closest("figure");
    if (escala(apaisada, ancho, alto) >= escala(vertical, ancho, alto) * gananciaMinima) {
      svg.style.maxHeight = `${apaisada.alto}px`;
      llevarALaPaginaApaisada(figura);
    }
  }

  /** El título de la sección y su párrafo viajan con el diagrama para no quedar huérfanos. */
  function llevarALaPaginaApaisada(figura) {
    const acompanantes = [];
    let previo = figura.previousElementSibling;
    while (previo && acompanantes.length < 3 && ["H3", "H4", "P"].includes(previo.tagName)) {
      acompanantes.unshift(previo);
      if (previo.tagName !== "P") break;
      previo = previo.previousElementSibling;
    }
    const tieneTitulo = acompanantes.length && acompanantes[0].tagName !== "P";
    const mover = tieneTitulo ? acompanantes : [];
    const pagina = document.createElement("section");
    pagina.className = "apaisada";
    figura.before(pagina);
    pagina.append(...mover, figura);
  }
}
