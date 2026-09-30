import { CambioEsDescenso, DescensoNoPermitido, PlanSinCobro, VigenciaNoDisponible } from "./errores";
import type { ConceptoPago } from "./pago";
import type { Plan } from "./plan";
import type { CambioSuscripcion, Suscripcion } from "./suscripcion";
import type { VigenciaDias } from "./tarjeta";

const DIA_MS = 24 * 60 * 60 * 1000;
const VIGENCIA_ANUAL = 365;

export type TipoOperacion = "contratacion" | "ascenso" | "renovacion";

/** Lo que se cobra y cómo queda la vigencia si el pago se aprueba (07 y 08). */
export interface OperacionCobro {
  tipo: TipoOperacion;
  concepto: ConceptoPago;
  desde: Plan;
  destino: Plan;
  vigenciaDias: VigenciaDias;
  monto: number;
  inicio: Date;
  vence: Date;
}

const CONCEPTO_POR_TIPO: Record<TipoOperacion, ConceptoPago> = {
  contratacion: "contratacion",
  ascenso: "cambio-plan",
  renovacion: "renovacion",
};

export function esGratuito(plan: Plan): boolean {
  return plan.precio30 === 0;
}

export function precioDe(plan: Plan, vigenciaDias: number): number | null {
  return vigenciaDias === VIGENCIA_ANUAL ? plan.precio365 : plan.precio30;
}

export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() + dias * DIA_MS);
}

/** Días que faltan para `vence`, redondeando hacia arriba; `null` si no vence (Sandbox). */
export function diasRestantes(vence: Date | null, ahora: Date): number | null {
  if (!vence) return null;
  return Math.max(0, Math.ceil((vence.getTime() - ahora.getTime()) / DIA_MS));
}

function vigenciaTerminada(suscripcion: Suscripcion, ahora: Date): boolean {
  return suscripcion.vence !== null && suscripcion.vence.getTime() <= ahora.getTime();
}

/**
 * Política de cambio de plan (M2-02, M2-03, M2-04). Sin prorrateo (fuera de alcance):
 * - mismo plan → renovación: la vigencia nueva se suma al final de la actual;
 * - desde Sandbox o con la vigencia terminada → contratación desde hoy;
 * - a un plan de mayor nivel → ascenso: cobra el plan completo y la vigencia arranca hoy;
 * - a uno de menor nivel → no se cobra: es un descenso programado.
 */
export function operacionDeCobro(actual: Suscripcion, destino: Plan, vigenciaDias: VigenciaDias, ahora: Date): OperacionCobro {
  if (esGratuito(destino)) throw new PlanSinCobro(destino.nombre);
  const monto = precioDe(destino, vigenciaDias);
  if (monto === null) throw new VigenciaNoDisponible(destino.nombre, vigenciaDias);

  const base = { desde: actual.plan, destino, vigenciaDias, monto };
  if (destino.id === actual.plan.id) return renovacion(actual, base, ahora);
  if (esGratuito(actual.plan) || vigenciaTerminada(actual, ahora)) return desdeHoy("contratacion", base, ahora);
  if (destino.orden > actual.plan.orden) return desdeHoy("ascenso", base, ahora);
  throw new CambioEsDescenso(destino.nombre);
}

type BaseOperacion = Pick<OperacionCobro, "desde" | "destino" | "vigenciaDias" | "monto">;

function desdeHoy(tipo: TipoOperacion, base: BaseOperacion, ahora: Date): OperacionCobro {
  return { ...base, tipo, concepto: CONCEPTO_POR_TIPO[tipo], inicio: ahora, vence: sumarDias(ahora, base.vigenciaDias) };
}

function renovacion(actual: Suscripcion, base: BaseOperacion, ahora: Date): OperacionCobro {
  if (!actual.vence || vigenciaTerminada(actual, ahora)) return desdeHoy("renovacion", base, ahora);
  return {
    ...base,
    tipo: "renovacion",
    concepto: CONCEPTO_POR_TIPO.renovacion,
    inicio: actual.inicio,
    vence: sumarDias(actual.vence, base.vigenciaDias),
  };
}

/** Cómo queda la suscripción cuando el pago se aprueba: Activa y sin descenso pendiente. */
export function cambioTrasCobro(operacion: OperacionCobro, ahora: Date): CambioSuscripcion {
  return {
    planId: operacion.destino.id,
    estado: "activa",
    estadoDesde: ahora,
    vigenciaDias: operacion.vigenciaDias,
    inicio: operacion.inicio,
    vence: operacion.vence,
    planSiguienteId: null,
  };
}

/**
 * Descenso (M2-04): sigue en su plan hasta `vence` y después pasa a `destino`.
 * Solo se programa; lo aplica la tarea diaria del ciclo §4.4 (M2-05).
 */
export function validarDescenso(actual: Suscripcion, destino: Plan, ahora: Date): void {
  if (destino.orden >= actual.plan.orden) throw new DescensoNoPermitido(`Pasar a ${destino.nombre} no es un descenso.`);
  if (!actual.vence || vigenciaTerminada(actual, ahora)) {
    throw new DescensoNoPermitido("Tu vigencia ya terminó: contrata el plan que quieras desde Planes.");
  }
}
