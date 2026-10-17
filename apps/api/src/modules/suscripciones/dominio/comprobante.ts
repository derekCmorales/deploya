import { sumarDias } from "./cambio-plan";
import type { Pago } from "./pago";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DECIMALES_MONTO = 2;

export const AGRADECIMIENTO = "Gracias por confiar en deploya.";
export const CONTACTO_SOPORTE = "¿Dudas sobre este cobro? Escríbenos a soporte@deploya.app";
const METODO_TARJETA = "Tarjeta";

/** Un pago con lo que la lectura agrega: el nombre del plan y el titular de la cuenta. */
export interface PagoHistorial extends Pago {
  planNombre: string;
  titular: string;
  correo: string;
}

export interface Vigencia {
  desde: Date;
  hasta: Date;
}

/** Una fila de `GET /suscripciones/pagos` (pantalla 09). */
export interface FilaPago {
  id: string;
  fecha: Date;
  concepto: string;
  plan: string;
  monto: number;
  moneda: string;
  estado: Pago["estado"];
  comprobante: string | null;
  vigencia: Vigencia | null;
  tarjeta: string;
  titular: string;
}

/** «Plan Starter · 30 días». */
export function conceptoDe(p: Pick<PagoHistorial, "planNombre" | "vigenciaDias">): string {
  return `Plan ${p.planNombre} · ${p.vigenciaDias} días`;
}

export function tarjetaOculta(ultimos4: string): string {
  return `•••• ${ultimos4}`;
}

/**
 * La vigencia que pagó: desde el pago y por los días del plan. Un rechazado no compra vigencia.
 * Una renovación anticipada suma sus días al final de la vigencia anterior; el pago no guarda esa
 * fecha (datos 1.3 sin cambios), así que el comprobante muestra los días desde el pago.
 */
export function vigenciaDe(p: Pick<Pago, "estado" | "creado" | "vigenciaDias">): Vigencia | null {
  if (p.estado !== "aprobado") return null;
  return { desde: p.creado, hasta: sumarDias(p.creado, p.vigenciaDias) };
}

export function filaDePago(p: PagoHistorial): FilaPago {
  return {
    id: p.id,
    fecha: p.creado,
    concepto: conceptoDe(p),
    plan: p.planNombre,
    monto: p.monto,
    moneda: p.moneda,
    estado: p.estado,
    comprobante: p.numeroComprobante,
    vigencia: vigenciaDe(p),
    tarjeta: tarjetaOculta(p.tarjetaUltimos4),
    titular: p.titular,
  };
}

function dosDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

/** «03 sep 2026, 16:10» en UTC. */
export function fechaHora(fecha: Date): string {
  return `${fechaLarga(fecha)}, ${dosDigitos(fecha.getUTCHours())}:${dosDigitos(fecha.getUTCMinutes())}`;
}

/** «03 sep 2026». */
export function fechaLarga(fecha: Date): string {
  return `${diaMes(fecha)} ${fecha.getUTCFullYear()}`;
}

function diaMes(fecha: Date): string {
  return `${dosDigitos(fecha.getUTCDate())} ${MESES[fecha.getUTCMonth()]}`;
}

/** «03 sep → 03 oct 2026». */
export function textoVigencia({ desde, hasta }: Vigencia): string {
  return `${diaMes(desde)} → ${fechaLarga(hasta)}`;
}

export function textoMonto(monto: number, moneda: string): string {
  return `${moneda} ${monto.toFixed(DECIMALES_MONTO)}`;
}

/** Una partida del comprobante: qué se pagó, por cuánto tiempo y cuánto. */
export interface PartidaComprobante {
  descripcion: string;
  detalle: string;
  vigencia: string;
  monto: string;
}

/**
 * Value Object del comprobante de un pago aprobado: una sola fuente para el PDF (estructura de
 * recibo: emisor, facturado a, partida y totales). Se construye solo desde un pago aprobado con número.
 */
export class Comprobante {
  private constructor(
    readonly numero: string,
    readonly fecha: Date,
    readonly plan: string,
    readonly vigenciaDias: number,
    readonly vigencia: Vigencia,
    readonly metodo: string,
    readonly titular: string,
    readonly correo: string,
    readonly total: number,
    readonly moneda: string,
  ) {}

  /** `null` si el pago no tiene comprobante (rechazado). */
  static desde(p: PagoHistorial): Comprobante | null {
    const vigencia = vigenciaDe(p);
    if (!p.numeroComprobante || !vigencia) return null;
    return new Comprobante(
      p.numeroComprobante,
      p.creado,
      p.planNombre,
      p.vigenciaDias,
      vigencia,
      `${METODO_TARJETA} ${tarjetaOculta(p.tarjetaUltimos4)}`,
      p.titular,
      p.correo,
      p.monto,
      p.moneda,
    );
  }

  get nombreArchivo(): string {
    return `${this.numero}.pdf`;
  }

  get concepto(): string {
    return conceptoDe({ planNombre: this.plan, vigenciaDias: this.vigenciaDias });
  }

  get fechaPago(): string {
    return fechaHora(this.fecha);
  }

  get totalTexto(): string {
    return textoMonto(this.total, this.moneda);
  }

  partida(): PartidaComprobante {
    return {
      descripcion: `Plan ${this.plan}`,
      detalle: `Suscripción de ${this.vigenciaDias} días`,
      vigencia: textoVigencia(this.vigencia),
      monto: this.totalTexto,
    };
  }

  /** El contenido completo en texto plano, en el orden del PDF (lo que devuelve el doble de pruebas). */
  lineas(): string[] {
    const partida = this.partida();
    return [
      "deploya · Comprobante de pago",
      `Número: ${this.numero}`,
      "Estado: Aprobado",
      `Total pagado: ${this.totalTexto}`,
      `Fecha de pago: ${this.fechaPago}`,
      `Facturado a: ${this.titular} · ${this.correo}`,
      `Método de pago: ${this.metodo}`,
      `Concepto: ${partida.descripcion} · ${partida.detalle}`,
      `Vigencia: ${partida.vigencia}`,
      `Subtotal: ${this.totalTexto}`,
      `Total: ${this.totalTexto}`,
      AGRADECIMIENTO,
      CONTACTO_SOPORTE,
    ];
  }
}
