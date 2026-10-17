import type { PagoHistorial } from "../dominio/comprobante";
import { MONEDA, numeroComprobante, type NuevoPago, type Pago } from "../dominio/pago";
import type { Plan } from "../dominio/plan";
import { RepositorioPagos } from "../puertos/repositorio-pagos.puerto";

/**
 * Doble en memoria para pruebas: mismo contrato que el adaptador Prisma. Resuelve el nombre del
 * plan con la lista que recibe y el titular con `titulares` (por usuario).
 */
export class RepositorioPagosMemoria extends RepositorioPagos {
  private readonly pagos: Pago[] = [];

  constructor(
    private readonly planes: Plan[] = [],
    private readonly titulares: Record<string, string> = {},
  ) {
    super();
  }

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

  async deUsuario(usuarioId: string): Promise<PagoHistorial[]> {
    return this.pagos
      .filter((p) => p.usuarioId === usuarioId)
      .sort((a, b) => b.creado.getTime() - a.creado.getTime())
      .map((p) => this.historial(p));
  }

  async porId(pagoId: string): Promise<PagoHistorial | null> {
    const pago = this.pagos.find((p) => p.id === pagoId);
    return pago ? this.historial(pago) : null;
  }

  guardados(): Pago[] {
    return this.pagos.map((p) => ({ ...p }));
  }

  private historial(pago: Pago): PagoHistorial {
    const plan = this.planes.find((p) => p.id === pago.planId);
    return { ...pago, planNombre: plan?.nombre ?? pago.planId, titular: this.titulares[pago.usuarioId] ?? "" };
  }
}
