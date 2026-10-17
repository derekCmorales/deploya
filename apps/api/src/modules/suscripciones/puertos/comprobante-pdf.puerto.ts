import type { Comprobante } from "../dominio/comprobante";

/** Arma el PDF del comprobante; el servicio no conoce la librería (M2-06). */
export abstract class ComprobantePdfPuerto {
  abstract generar(comprobante: Comprobante): Promise<Buffer>;
}
