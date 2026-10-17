import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { AGRADECIMIENTO, CONTACTO_SOPORTE, type Comprobante } from "../dominio/comprobante";
import { ComprobantePdfPuerto } from "../puertos/comprobante-pdf.puerto";

type Documento = PDFKit.PDFDocument;

/** Tema claro del design system v4.1 (`globals.css`) en RGB: el PDF no lee variables CSS. */
const PALETA = {
  tinta: "#1a1510",
  apagado: "#5e5852",
  tenue: "#96918c",
  hundido: "#f2efe9",
  borde: "#dbd7d0",
  senal: "#0065b4",
  ok: "#00784f",
  okSuave: "#dff0e8",
} as const;

const FUENTE = "Helvetica";
const FUENTE_NEGRITA = "Helvetica-Bold";
const FUENTE_NUMERO = "Courier";
const MARGEN = 56;
const ANCHO_A4 = 595.28;
const ALTO_A4 = 841.89;
const ANCHO = ANCHO_A4 - 2 * MARGEN;
const ESPACIADO_ETIQUETA = 1.1;
const RADIO = 8;
const ALTO_PIE = 64;

/** Helvetica estándar (WinAnsi) no trae «→»: en el PDF la vigencia va con «–». */
export function paraHelvetica(texto: string): string {
  return texto.replaceAll("→", "–");
}

/**
 * Adapter de `ComprobantePdfPuerto` sobre `pdfkit`: una página A4 con estructura de recibo,
 * igual que el panel «Comprobante» de 09 (marca, total pagado, facturado a, partida y totales).
 */
@Injectable()
export class ComprobantePdfKit extends ComprobantePdfPuerto {
  generar(comprobante: Comprobante): Promise<Buffer> {
    return new Promise((resolver, rechazar) => {
      const documento = new PDFDocument({ size: "A4", margin: MARGEN, info: { Title: `Comprobante ${comprobante.numero}`, Author: "deploya" } });
      const partes: Buffer[] = [];
      documento.on("data", (parte: Buffer) => partes.push(parte));
      documento.on("end", () => resolver(Buffer.concat(partes)));
      documento.on("error", rechazar);

      let y = encabezado(documento, comprobante, MARGEN);
      y = resumen(documento, comprobante, y);
      y = facturacion(documento, comprobante, y);
      y = partida(documento, comprobante, y);
      totales(documento, comprobante, y);
      pie(documento);
      documento.end();
    });
  }
}

function etiqueta(documento: Documento, texto: string, x: number, y: number, opciones: PDFKit.Mixins.TextOptions = {}): void {
  documento.font(FUENTE).fontSize(8).fillColor(PALETA.tenue).text(texto.toUpperCase(), x, y, { characterSpacing: ESPACIADO_ETIQUETA, ...opciones });
}

function separador(documento: Documento, y: number, x = MARGEN, ancho = ANCHO): void {
  documento.moveTo(x, y).lineTo(x + ancho, y).lineWidth(0.75).strokeColor(PALETA.borde).stroke();
}

/** Marca «deploya» con la última «a» en Señal y, a la derecha, el tipo de documento y su número. */
function encabezado(documento: Documento, c: Comprobante, y: number): number {
  documento.font(FUENTE_NEGRITA).fontSize(26).fillColor(PALETA.tinta).text("deploy", MARGEN, y, { continued: true }).fillColor(PALETA.senal).text("a");
  etiqueta(documento, "Comprobante de pago", MARGEN, y + 2, { width: ANCHO, align: "right" });
  documento.font(FUENTE_NUMERO).fontSize(12).fillColor(PALETA.tinta).text(c.numero, MARGEN, y + 16, { width: ANCHO, align: "right" });
  const fin = y + 48;
  separador(documento, fin);
  return fin + 24;
}

/** «Total pagado» grande con la píldora «Aprobado» y, a la derecha, la fecha del pago. */
function resumen(documento: Documento, c: Comprobante, y: number): number {
  documento.font(FUENTE).fontSize(10).fillColor(PALETA.apagado).text("Total pagado", MARGEN, y);
  documento.font(FUENTE_NEGRITA).fontSize(30).fillColor(PALETA.tinta).text(c.totalTexto, MARGEN, y + 14);
  const anchoTotal = documento.widthOfString(c.totalTexto);
  pildora(documento, "Aprobado", MARGEN + anchoTotal + 14, y + 24);
  documento.font(FUENTE).fontSize(10).fillColor(PALETA.apagado).text("Fecha de pago", MARGEN, y, { width: ANCHO, align: "right" });
  documento.font(FUENTE_NEGRITA).fontSize(11).fillColor(PALETA.tinta).text(c.fechaPago, MARGEN, y + 16, { width: ANCHO, align: "right" });
  return y + 70;
}

function pildora(documento: Documento, texto: string, x: number, y: number): void {
  documento.font(FUENTE_NEGRITA).fontSize(9);
  const ancho = documento.widthOfString(texto) + 16;
  documento.roundedRect(x, y, ancho, 18, 9).fill(PALETA.okSuave);
  documento.fillColor(PALETA.ok).text(texto, x, y + 5, { width: ancho, align: "center" });
}

/** Dos bloques sobre `sunken`: a quién se le cobró y con qué se pagó. */
function facturacion(documento: Documento, c: Comprobante, y: number): number {
  const separacion = 16;
  const anchoBloque = (ANCHO - separacion) / 2;
  const alto = 72;
  bloque(documento, MARGEN, y, anchoBloque, alto, "Facturado a", c.titular, c.correo);
  bloque(documento, MARGEN + anchoBloque + separacion, y, anchoBloque, alto, "Método de pago", c.metodo, `Pago único en ${c.moneda}`);
  return y + alto + 28;
}

function bloque(documento: Documento, x: number, y: number, ancho: number, alto: number, titulo: string, principal: string, secundario: string): void {
  documento.roundedRect(x, y, ancho, alto, RADIO).fill(PALETA.hundido);
  const relleno = 14;
  etiqueta(documento, titulo, x + relleno, y + relleno);
  documento.font(FUENTE_NEGRITA).fontSize(11).fillColor(PALETA.tinta).text(principal, x + relleno, y + relleno + 16, { width: ancho - 2 * relleno });
  documento.font(FUENTE).fontSize(9.5).fillColor(PALETA.apagado).text(secundario, x + relleno, y + relleno + 32, { width: ancho - 2 * relleno });
}

const COLUMNAS = { vigencia: MARGEN + 250, monto: MARGEN + ANCHO - 110, anchoMonto: 110 } as const;

/** La partida pagada como una fila de tabla: descripción, vigencia y monto. */
function partida(documento: Documento, c: Comprobante, y: number): number {
  const p = c.partida();
  etiqueta(documento, "Descripción", MARGEN, y);
  etiqueta(documento, "Vigencia", COLUMNAS.vigencia, y);
  etiqueta(documento, "Monto", COLUMNAS.monto, y, { width: COLUMNAS.anchoMonto, align: "right" });
  separador(documento, y + 16);
  const fila = y + 28;
  documento.font(FUENTE_NEGRITA).fontSize(11).fillColor(PALETA.tinta).text(p.descripcion, MARGEN, fila);
  documento.font(FUENTE).fontSize(9.5).fillColor(PALETA.apagado).text(p.detalle, MARGEN, fila + 16);
  documento.font(FUENTE).fontSize(10.5).fillColor(PALETA.tinta).text(paraHelvetica(p.vigencia), COLUMNAS.vigencia, fila + 1);
  documento.font(FUENTE_NEGRITA).fontSize(11).text(p.monto, COLUMNAS.monto, fila, { width: COLUMNAS.anchoMonto, align: "right" });
  const fin = fila + 40;
  separador(documento, fin);
  return fin + 16;
}

/** Subtotal y total alineados a la derecha, como en el panel de 09. */
function totales(documento: Documento, c: Comprobante, y: number): void {
  const ancho = 220;
  const x = MARGEN + ANCHO - ancho;
  documento.font(FUENTE).fontSize(10.5).fillColor(PALETA.apagado).text("Subtotal", x, y);
  documento.fillColor(PALETA.tinta).text(c.totalTexto, x, y, { width: ancho, align: "right" });
  separador(documento, y + 22, x, ancho);
  documento.font(FUENTE_NEGRITA).fontSize(13).fillColor(PALETA.tinta).text("Total", x, y + 32);
  documento.text(c.totalTexto, x, y + 32, { width: ancho, align: "right" });
}

/** Agradecimiento y contacto al pie de la página. */
function pie(documento: Documento): void {
  const y = ALTO_A4 - MARGEN - ALTO_PIE;
  separador(documento, y);
  documento.font(FUENTE_NEGRITA).fontSize(11).fillColor(PALETA.tinta).text(AGRADECIMIENTO, MARGEN, y + 18);
  documento.font(FUENTE).fontSize(9.5).fillColor(PALETA.apagado).text(CONTACTO_SOPORTE, MARGEN, y + 36);
  documento.font(FUENTE_NEGRITA).fontSize(10).fillColor(PALETA.senal).text("deploya.app", MARGEN, y + 18, { width: ANCHO, align: "right" });
}
