import { sumarDias } from "./cambio-plan";
import type { Pago } from "./pago";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DECIMALES_MONTO = 2;

export const LEYENDA_SIN_VALOR_FISCAL = "Pago simulado · sin cobro real · sin valor fiscal.";
const METODO_PRUEBA = "Prueba";

/** Un pago con lo que la lectura agrega: el nombre del plan y el titular de la cuenta. */
export interface PagoHistorial extends Pago {
  planNombre: string;
  titular: string;
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

/**
 * Value Object del comprobante de un pago aprobado: una sola fuente para el PDF y para el panel
 * «Comprobante» de 09. Se construye solo desde un pago aprobado con número.
 */
export class Comprobante {
  private constructor(
    readonly numero: string,
    readonly fecha: Date,
    readonly concepto: string,
    readonly plan: string,
    readonly vigencia: Vigencia,
    readonly metodo: string,
    readonly titular: string,
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
      conceptoDe(p),
      p.planNombre,
      vigencia,
      `${METODO_PRUEBA} ${tarjetaOculta(p.tarjetaUltimos4)}`,
      p.titular,
      p.monto,
      p.moneda,
    );
  }

  get nombreArchivo(): string {
    return `${this.numero}.pdf`;
  }

  /** Pares etiqueta · valor en el orden del panel de 09. */
  filas(): [string, string][] {
    return [
      ["Número", this.numero],
      ["Fecha", fechaHora(this.fecha)],
      ["Concepto", this.concepto],
      ["Vigencia", textoVigencia(this.vigencia)],
      ["Método", this.metodo],
      ["Titular", this.titular],
      ["Subtotal", textoMonto(this.total, this.moneda)],
      ["Total", textoMonto(this.total, this.moneda)],
    ];
  }

  /** El contenido completo en texto plano (lo que el doble de pruebas devuelve como PDF). */
  lineas(): string[] {
    return ["deploya · Comprobante de pago", ...this.filas().map(([etiqueta, valor]) => `${etiqueta}: ${valor}`), LEYENDA_SIN_VALOR_FISCAL];
  }
}
