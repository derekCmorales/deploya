import type { NuevoPago, Pago } from "../dominio/pago";

export abstract class RepositorioPagos {
  /** Guarda el pago; si es aprobado le asigna el siguiente `numeroComprobante` del año (I2). */
  abstract registrar(nuevo: NuevoPago): Promise<Pago>;
}
