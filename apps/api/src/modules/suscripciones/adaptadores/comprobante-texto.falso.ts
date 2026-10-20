import type { Comprobante } from "../dominio/comprobante";
import { ComprobantePdfPuerto } from "../puertos/comprobante-pdf.puerto";

/** Doble de pruebas: devuelve las líneas del comprobante como texto para revisar el contenido sin parsear PDF. */
export class ComprobanteTextoFalso extends ComprobantePdfPuerto {
  readonly generados: Comprobante[] = [];

  async generar(comprobante: Comprobante): Promise<Buffer> {
    this.generados.push(comprobante);
    return Buffer.from(comprobante.lineas().join("\n"), "utf8");
  }
}
