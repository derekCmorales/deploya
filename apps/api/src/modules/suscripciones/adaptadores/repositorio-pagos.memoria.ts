import { MONEDA, numeroComprobante, type NuevoPago, type Pago } from "../dominio/pago";
import { RepositorioPagos } from "../puertos/repositorio-pagos.puerto";

/** Doble en memoria para pruebas: mismo contrato que el adaptador Prisma. */
export class RepositorioPagosMemoria extends RepositorioPagos {
  private readonly pagos: Pago[] = [];

  async registrar(nuevo: NuevoPago): Promise<Pago> {
    const anio = nuevo.creado.getUTCFullYear();
    const aprobadosDelAnio = this.pagos.filter((p) => p.estado === "aprobado" && p.creado.getUTCFullYear() === anio).length;
    const pago: Pago = {
      ...nuevo,
      id: `pago-${this.pagos.length + 1}`,
      moneda: MONEDA,
      numeroComprobante: nuevo.estado === "aprobado" ? numeroComprobante(anio, aprobadosDelAnio + 1) : null,
    };
    this.pagos.push(pago);
    return { ...pago };
  }

  guardados(): Pago[] {
    return this.pagos.map((p) => ({ ...p }));
  }
}
