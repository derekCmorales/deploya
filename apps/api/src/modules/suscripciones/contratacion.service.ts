import { Injectable } from "@nestjs/common";
import { Reloj } from "../../compartido/reloj";
import { cambioTrasCobro, operacionDeCobro, validarDescenso, type OperacionCobro } from "./dominio/cambio-plan";
import { PlanNoEncontrado, SuscripcionNoEncontrada } from "./dominio/errores";
import { cotizacionDe, vistaSuscripcion, type Cotizacion, type VistaSuscripcion } from "./dominio/mi-suscripcion";
import { MONEDA, type Pago } from "./dominio/pago";
import type { Plan } from "./dominio/plan";
import type { Suscripcion } from "./dominio/suscripcion";
import type { SolicitudContratacion, SolicitudCotizacion } from "./dominio/tarjeta";
import { PasarelaPago } from "./puertos/pasarela-pago.puerto";
import { RepositorioPagos } from "./puertos/repositorio-pagos.puerto";
import { RepositorioPlanes } from "./puertos/repositorio-planes.puerto";
import { RepositorioSuscripciones } from "./puertos/repositorio-suscripciones.puerto";

/** Lo que 07b pinta: comprobante y vigencia si se aprobó; motivo si se rechazó. */
export type ResultadoContratacion =
  | { resultado: "aprobado"; pago: ComprobantePago; suscripcion: VistaSuscripcion }
  | { resultado: "rechazado"; pago: ComprobantePago; codigo: string; motivo: string };

export type ComprobantePago = Pick<
  Pago,
  "id" | "concepto" | "monto" | "moneda" | "estado" | "tarjetaUltimos4" | "numeroComprobante" | "creado"
>;

/**
 * Casos de uso del cliente sobre su suscripción (M2-02, M2-03, M2-04): ver la suya,
 * cotizar, pagar (contratación, ascenso o renovación) y programar un descenso.
 * La política de `dominio/cambio-plan.ts` decide qué operación es y cuánto cuesta.
 */
@Injectable()
export class ContratacionService {
  constructor(
    private readonly planes: RepositorioPlanes,
    private readonly suscripciones: RepositorioSuscripciones,
    private readonly pagos: RepositorioPagos,
    private readonly pasarela: PasarelaPago,
    private readonly reloj: Reloj,
  ) {}

  async miSuscripcion(usuarioId: string): Promise<VistaSuscripcion> {
    return vistaSuscripcion(await this.suscripcionDe(usuarioId), this.reloj.ahora());
  }

  async cotizar(usuarioId: string, solicitud: SolicitudCotizacion): Promise<Cotizacion> {
    const { operacion } = await this.operacion(usuarioId, solicitud);
    return cotizacionDe(operacion, MONEDA);
  }

  async contratar(usuarioId: string, solicitud: SolicitudContratacion): Promise<ResultadoContratacion> {
    const { suscripcion, operacion } = await this.operacion(usuarioId, solicitud);
    const cobro = await this.pasarela.cobrar({
      monto: operacion.monto,
      moneda: MONEDA,
      concepto: operacion.concepto,
      tarjeta: solicitud.tarjeta,
    });
    const pago = await this.pagos.registrar({
      usuarioId,
      suscripcionId: suscripcion.id,
      planId: operacion.destino.id,
      concepto: operacion.concepto,
      vigenciaDias: operacion.vigenciaDias,
      monto: operacion.monto,
      estado: cobro.aprobado ? "aprobado" : "rechazado",
      motivoRechazo: cobro.aprobado ? null : cobro.motivo,
      tarjetaUltimos4: cobro.tarjetaUltimos4,
      creado: this.reloj.ahora(),
    });
    if (!cobro.aprobado) return { resultado: "rechazado", pago: comprobante(pago), codigo: cobro.codigo, motivo: cobro.motivo };

    const ahora = this.reloj.ahora();
    const actualizada = await this.suscripciones.actualizar(suscripcion.id, cambioTrasCobro(operacion, ahora));
    return { resultado: "aprobado", pago: comprobante(pago), suscripcion: vistaSuscripcion(actualizada, ahora) };
  }

  async programarDescenso(usuarioId: string, codigoPlan: string): Promise<VistaSuscripcion> {
    const [suscripcion, destino] = await Promise.all([this.suscripcionDe(usuarioId), this.plan(codigoPlan)]);
    const ahora = this.reloj.ahora();
    validarDescenso(suscripcion, destino, ahora);
    return vistaSuscripcion(await this.suscripciones.programarDescenso(suscripcion.id, destino.id), ahora);
  }

  private async operacion(
    usuarioId: string,
    { plan, vigenciaDias }: SolicitudCotizacion,
  ): Promise<{ suscripcion: Suscripcion; operacion: OperacionCobro }> {
    const [suscripcion, destino] = await Promise.all([this.suscripcionDe(usuarioId), this.plan(plan)]);
    return { suscripcion, operacion: operacionDeCobro(suscripcion, destino, vigenciaDias, this.reloj.ahora()) };
  }

  private async suscripcionDe(usuarioId: string): Promise<Suscripcion> {
    const suscripcion = await this.suscripciones.deUsuario(usuarioId);
    if (!suscripcion) throw new SuscripcionNoEncontrada(usuarioId);
    return suscripcion;
  }

  private async plan(codigo: string): Promise<Plan> {
    const plan = await this.planes.porCodigo(codigo);
    if (!plan || !plan.activo) throw new PlanNoEncontrado(codigo);
    return plan;
  }
}

function comprobante({ id, concepto, monto, moneda, estado, tarjetaUltimos4, numeroComprobante, creado }: Pago): ComprobantePago {
  return { id, concepto, monto, moneda, estado, tarjetaUltimos4, numeroComprobante, creado };
}
