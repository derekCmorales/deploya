import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { LEYENDA_SIN_VALOR_FISCAL, type Comprobante } from "../dominio/comprobante";
import { ComprobantePdfPuerto } from "../puertos/comprobante-pdf.puerto";

const MARGEN = 56;
const ANCHO_ETIQUETA = 120;
const TAMANO_TITULO = 20;
const TAMANO_TEXTO = 11;
const TAMANO_NOTA = 9;
const SEPARACION = 0.6;
const FUENTE = "Helvetica";
const FUENTE_NEGRITA = "Helvetica-Bold";

/** Helvetica estándar (WinAnsi) no trae «→»: en el PDF la vigencia va con «–». */
export function paraHelvetica(texto: string): string {
  return texto.replaceAll("→", "–");
}

/** Adapter de `ComprobantePdfPuerto` sobre `pdfkit`: una página A4 con las filas del comprobante. */
@Injectable()
export class ComprobantePdfKit extends ComprobantePdfPuerto {
  generar(comprobante: Comprobante): Promise<Buffer> {
    return new Promise((resolver, rechazar) => {
      const documento = new PDFDocument({ size: "A4", margin: MARGEN, info: { Title: `Comprobante ${comprobante.numero}`, Author: "deploya" } });
      const partes: Buffer[] = [];
      documento.on("data", (parte: Buffer) => partes.push(parte));
      documento.on("end", () => resolver(Buffer.concat(partes)));
      documento.on("error", rechazar);

      documento.font(FUENTE_NEGRITA).fontSize(TAMANO_TITULO).text("deploya");
      documento.font(FUENTE).fontSize(TAMANO_TEXTO).text("Comprobante de pago").moveDown();
      for (const [etiqueta, valor] of comprobante.filas()) {
        const y = documento.y;
        documento.font(FUENTE).text(etiqueta, MARGEN, y, { width: ANCHO_ETIQUETA });
        documento.font(FUENTE_NEGRITA).text(paraHelvetica(valor), MARGEN + ANCHO_ETIQUETA, y);
        documento.moveDown(SEPARACION);
      }
      documento.moveDown().font(FUENTE).fontSize(TAMANO_NOTA).text(LEYENDA_SIN_VALOR_FISCAL, MARGEN);
      documento.end();
    });
  }
}
