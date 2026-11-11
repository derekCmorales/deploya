import { ANCHO_CORREO, COLOR_CORREO as C, FUENTE_CORREO, FUENTE_MONO_CORREO } from "./estilo-correo";

/** Mensaje listo para transportar: lo que recibe cualquier adaptador de `CorreoPuerto`. */
export interface MensajeCorreo {
  asunto: string;
  html: string;
  texto: string;
}

/** Fila «nombre · valor» de los avisos de 24b (Versión, Duración, URL, Plan…). */
export interface DetalleCorreo {
  nombre: string;
  valor: string;
}

const SOPORTE = "soporte@deploya.app";
const PIE = `deploya · ${SOPORTE}`;

/** Escapa lo que llega de la API (nombre, correo, enlace) antes de meterlo en el HTML. */
export function escaparHtml(valor: string): string {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Template Method (pantallas 24 y 24b): el esqueleto (marca, botón, enlace en texto plano y pie)
 * es fijo; cada plantilla aporta su asunto, título, párrafo, botón y aviso final. Los avisos de
 * 24b además llenan los ganchos opcionales (etiqueta, estado, notas, detalles y líneas de la
 * bitácora); si una plantilla no los usa, el correo sale igual que en 24.
 */
export abstract class PlantillaCorreo<D extends { enlace: string }> {
  protected abstract asunto(datos: D): string;
  protected abstract titulo(datos: D): string;
  protected abstract parrafo(datos: D): string;
  protected abstract textoBoton(datos: D): string;
  protected abstract aviso(datos: D): string;

  /** Rótulo sobre el título («Despliegue», «Suscripción»). */
  protected etiqueta(_datos: D): string | null {
    return null;
  }

  /** Línea corta de estado bajo el párrafo («5 / 5 · Saludable»). */
  protected estado(_datos: D): string | null {
    return null;
  }

  /** Párrafos extra después del principal. */
  protected notas(_datos: D): readonly string[] {
    return [];
  }

  protected detalles(_datos: D): readonly DetalleCorreo[] {
    return [];
  }

  /** Últimas líneas de la bitácora, en monoespaciada. */
  protected lineas(_datos: D): readonly string[] {
    return [];
  }

  componer(datos: D): MensajeCorreo {
    const enlace = escaparHtml(datos.enlace);
    const etiqueta = this.etiqueta(datos);
    const estado = this.estado(datos);
    const notas = this.notas(datos);
    const detalles = this.detalles(datos);
    const lineas = this.lineas(datos);

    const html = htmlCorreo({
      asunto: this.asunto(datos),
      previa: this.parrafo(datos),
      cuerpo: [
        etiqueta ? htmlEtiqueta(etiqueta) : "",
        htmlTitulo(this.titulo(datos)),
        htmlParrafo(this.parrafo(datos)),
        ...notas.map(htmlParrafo),
        estado ? htmlEstado(estado) : "",
        detalles.length > 0 ? htmlDetalles(detalles) : "",
        lineas.length > 0 ? htmlLineas(lineas) : "",
        htmlBoton(enlace, this.textoBoton(datos)),
        htmlEnlaceAlterno(enlace),
        htmlAviso(this.aviso(datos)),
      ].join(""),
    });

    const extras = [
      ...notas,
      ...(estado ? [estado] : []),
      ...detalles.map((d) => `${d.nombre}: ${d.valor}`),
      ...lineas,
    ];
    const texto = [
      ...(etiqueta ? [etiqueta, ""] : []),
      this.titulo(datos),
      "",
      this.parrafo(datos),
      "",
      ...(extras.length > 0 ? [...extras, ""] : []),
      `${this.textoBoton(datos)}: ${datos.enlace}`,
      "",
      this.aviso(datos),
      "",
      PIE,
    ].join("\n");
    return { asunto: this.asunto(datos), html, texto };
  }
}

interface MarcoCorreo {
  asunto: string;
  /** Texto que el cliente muestra junto al asunto en la bandeja (preheader). */
  previa: string;
  cuerpo: string;
}

/**
 * Documento completo con maquetación de tablas y estilos en línea: es lo único que respetan
 * Gmail, Outlook y Apple Mail. Fondo papel, tarjeta con borde, marca arriba y pie fuera.
 */
function htmlCorreo(marco: MarcoCorreo): string {
  return [
    `<!DOCTYPE html>`,
    `<html lang="es" xmlns="http://www.w3.org/1999/xhtml">`,
    `<head>`,
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width,initial-scale=1">`,
    `<meta name="x-apple-disable-message-reformatting">`,
    `<meta name="color-scheme" content="light">`,
    `<meta name="supported-color-schemes" content="light">`,
    `<title>${escaparHtml(marco.asunto)}</title>`,
    `<style>`,
    `body{margin:0;padding:0;}`,
    `a{color:${C.senal};}`,
    `@media (max-width:600px){.dy-tarjeta{padding:28px 22px !important;}.dy-exterior{padding:24px 12px !important;}}`,
    `</style>`,
    `</head>`,
    `<body style="margin:0;padding:0;background-color:${C.fondo};-webkit-text-size-adjust:100%;">`,
    `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escaparHtml(marco.previa)}</div>`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.fondo};">`,
    `<tr><td align="center" class="dy-exterior" style="padding:40px 16px;">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:${ANCHO_CORREO}px;">`,
    `<tr><td style="padding:0 4px 20px;">${htmlMarca()}</td></tr>`,
    `<tr><td class="dy-tarjeta" style="background-color:${C.tarjeta};border:1px solid ${C.borde};border-radius:12px;padding:36px 36px 32px;font-family:${FUENTE_CORREO};color:${C.texto};">`,
    marco.cuerpo,
    `</td></tr>`,
    `<tr><td style="padding:20px 4px 0;font-family:${FUENTE_CORREO};font-size:12px;line-height:18px;color:${C.apagado};">`,
    `deploya · <a href="mailto:${SOPORTE}" style="color:${C.apagado};text-decoration:underline;">${SOPORTE}</a>`,
    `</td></tr>`,
    `</table>`,
    `</td></tr>`,
    `</table>`,
    `</body>`,
    `</html>`,
  ].join("");
}

/** Wordmark: «deploya» en minúsculas, peso 700, tracking cerrado, la última «a» en Señal. */
function htmlMarca(): string {
  return `<span style="font-family:${FUENTE_CORREO};font-size:22px;line-height:22px;font-weight:700;letter-spacing:-0.06em;color:${C.texto};">deploy<span style="color:${C.senal};">a</span></span>`;
}

function htmlEtiqueta(etiqueta: string): string {
  return `<p style="margin:0 0 8px;font-size:12px;line-height:16px;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;color:${C.tenue};">${escaparHtml(etiqueta)}</p>`;
}

function htmlTitulo(titulo: string): string {
  return `<h1 style="margin:0 0 12px;font-size:22px;line-height:28px;font-weight:600;letter-spacing:-0.02em;color:${C.texto};">${escaparHtml(titulo)}</h1>`;
}

function htmlParrafo(parrafo: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:${C.texto};">${escaparHtml(parrafo)}</p>`;
}

function htmlEstado(estado: string): string {
  return `<p style="margin:4px 0 20px;"><span style="display:inline-block;padding:4px 10px;border:1px solid ${C.borde};border-radius:999px;background-color:${C.hundido};font-family:${FUENTE_MONO_CORREO};font-size:12px;line-height:16px;color:${C.tenue};">${escaparHtml(estado)}</span></p>`;
}

function htmlDetalles(detalles: readonly DetalleCorreo[]): string {
  const filas = detalles
    .map(
      (d, i) =>
        `<tr>` +
        `<td style="padding:10px 16px 10px 0;${i > 0 ? `border-top:1px solid ${C.borde};` : ""}font-size:13px;line-height:18px;color:${C.tenue};white-space:nowrap;">${escaparHtml(d.nombre)}</td>` +
        `<td align="right" style="padding:10px 0;${i > 0 ? `border-top:1px solid ${C.borde};` : ""}font-family:${FUENTE_MONO_CORREO};font-size:13px;line-height:18px;color:${C.texto};word-break:break-all;">${escaparHtml(d.valor)}</td>` +
        `</tr>`,
    )
    .join("");
  return `<table role="presentation" data-seccion="detalles" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px;border-top:1px solid ${C.borde};border-bottom:1px solid ${C.borde};">${filas}</table>`;
}

function htmlLineas(lineas: readonly string[]): string {
  const cuerpo = lineas.map(escaparHtml).join("<br>");
  return `<div data-seccion="bitacora" style="margin:4px 0 24px;padding:12px 14px;background-color:${C.hundido};border:1px solid ${C.borde};border-radius:8px;font-family:${FUENTE_MONO_CORREO};font-size:12px;line-height:20px;color:${C.texto};overflow-wrap:break-word;word-wrap:break-word;">${cuerpo}</div>`;
}

/** Botón a prueba de clientes: celda con fondo (Outlook) y enlace con relleno (el resto). */
function htmlBoton(enlace: string, texto: string): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 28px;">` +
    `<tr><td align="center" bgcolor="${C.texto}" style="border-radius:8px;background-color:${C.texto};">` +
    `<a href="${enlace}" target="_blank" style="display:inline-block;padding:12px 22px;font-family:${FUENTE_CORREO};font-size:14px;line-height:20px;font-weight:600;color:${C.textoBoton};text-decoration:none;border-radius:8px;">${escaparHtml(texto)}</a>` +
    `</td></tr></table>`
  );
}

function htmlEnlaceAlterno(enlace: string): string {
  return (
    `<p style="margin:0 0 4px;font-size:13px;line-height:20px;color:${C.tenue};">¿El botón no funciona? Copia este enlace:</p>` +
    `<p style="margin:0 0 24px;font-family:${FUENTE_MONO_CORREO};font-size:12px;line-height:18px;word-break:break-all;"><a href="${enlace}" style="color:${C.senal};text-decoration:underline;">${enlace}</a></p>`
  );
}

function htmlAviso(aviso: string): string {
  return `<p style="margin:0;padding-top:20px;border-top:1px solid ${C.borde};font-size:13px;line-height:20px;color:${C.tenue};">${escaparHtml(aviso)}</p>`;
}
