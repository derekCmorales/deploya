/** Valores de la API; Prisma usa `cambio_plan` (traducción en `traduccion-prisma.ts`). */
export type ConceptoPago = "contratacion" | "renovacion" | "cambio-plan";
export type EstadoPago = "aprobado" | "rechazado";

export const MONEDA = "USD";
const PREFIJO_COMPROBANTE = "DPY";
const DIGITOS_COMPROBANTE = 6;

export interface NuevoPago {
  usuarioId: string;
  suscripcionId: string;
  planId: string;
  concepto: ConceptoPago;
  vigenciaDias: number;
  monto: number;
  estado: EstadoPago;
  motivoRechazo: string | null;
  tarjetaUltimos4: string;
  creado: Date;
}

export interface Pago extends NuevoPago {
  id: string;
  moneda: string;
  /** Solo en aprobados (invariante I2). */
  numeroComprobante: string | null;
}

/** «DPY-2026-000184»: año del pago y secuencia de aprobados de ese año. */
export function numeroComprobante(anio: number, secuencia: number): string {
  return `${PREFIJO_COMPROBANTE}-${anio}-${String(secuencia).padStart(DIGITOS_COMPROBANTE, "0")}`;
}

export function prefijoComprobante(anio: number): string {
  return `${PREFIJO_COMPROBANTE}-${anio}-`;
}
