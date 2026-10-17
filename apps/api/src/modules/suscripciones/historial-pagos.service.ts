import { Injectable } from "@nestjs/common";
import { Comprobante, filaDePago, type FilaPago } from "./dominio/comprobante";
import { PagoNoEncontrado } from "./dominio/errores";
import { ComprobantePdfPuerto } from "./puertos/comprobante-pdf.puerto";
import { RepositorioPagos } from "./puertos/repositorio-pagos.puerto";

export interface ArchivoComprobante {
  nombre: string;
  contenido: Buffer;
}

/** M2-06 (Service Layer de lectura): historial de 09 y comprobante PDF de un pago aprobado propio. */
@Injectable()
export class HistorialPagosService {
  constructor(
    private readonly pagos: RepositorioPagos,
    private readonly pdf: ComprobantePdfPuerto,
  ) {}

  async deUsuario(usuarioId: string): Promise<FilaPago[]> {
    return (await this.pagos.deUsuario(usuarioId)).map(filaDePago);
  }

  /** Ajeno, inexistente o rechazado → `PagoNoEncontrado` (404) sin generar ningún archivo. */
  async comprobante(usuarioId: string, pagoId: string): Promise<Comprobante> {
    const pago = await this.pagos.porId(pagoId);
    const comprobante = pago && pago.usuarioId === usuarioId ? Comprobante.desde(pago) : null;
    if (!comprobante) throw new PagoNoEncontrado(pagoId);
    return comprobante;
  }

  async pdfDe(usuarioId: string, pagoId: string): Promise<ArchivoComprobante> {
    const comprobante = await this.comprobante(usuarioId, pagoId);
    return { nombre: comprobante.nombreArchivo, contenido: await this.pdf.generar(comprobante) };
  }
}
