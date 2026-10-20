import type { PagoHistorial } from "../dominio/comprobante";
import type { NuevoPago, Pago } from "../dominio/pago";

export abstract class RepositorioPagos {
  /** Guarda el pago; si es aprobado le asigna el siguiente `numeroComprobante` del año (I2). */
  abstract registrar(nuevo: NuevoPago): Promise<Pago>;
  /** Pagos de la cuenta, del más reciente al más antiguo (M2-06). */
  abstract deUsuario(usuarioId: string): Promise<PagoHistorial[]>;
  abstract porId(pagoId: string): Promise<PagoHistorial | null>;
}
