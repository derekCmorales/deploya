import { diasRestantes, precioDe, type OperacionCobro } from "./cambio-plan";
import type { PlanCatalogo } from "./plan";
import type { EstadoSuscripcionValor, Suscripcion } from "./suscripcion";

/** `GET /suscripciones/mia` (pantalla 08 y «Plan actual» de 06). */
export interface VistaSuscripcion {
  plan: PlanCatalogo;
  estado: EstadoSuscripcionValor;
  vigenciaDias: number | null;
  inicio: Date;
  vence: Date | null;
  diasRestantes: number | null;
  /** Lo que cuesta renovar su vigencia; 0 en Sandbox. */
  precio: number;
  planSiguiente: { codigo: string; nombre: string } | null;
}

/** `GET /suscripciones/cotizacion` (resumen de 07): se calcula con la misma política que el cobro. */
export interface Cotizacion {
  tipo: OperacionCobro["tipo"];
  desde: { codigo: string; nombre: string };
  plan: { codigo: string; nombre: string };
  vigenciaDias: number;
  monto: number;
  moneda: string;
  inicio: Date;
  vence: Date;
}

export function vistaSuscripcion(suscripcion: Suscripcion, ahora: Date): VistaSuscripcion {
  const { id: _id, orden: _orden, activo: _activo, ...plan } = suscripcion.plan;
  const siguiente = suscripcion.planSiguiente;
  return {
    plan,
    estado: suscripcion.estado,
    vigenciaDias: suscripcion.vigenciaDias,
    inicio: suscripcion.inicio,
    vence: suscripcion.vence,
    diasRestantes: diasRestantes(suscripcion.vence, ahora),
    precio: suscripcion.vigenciaDias === null ? 0 : (precioDe(suscripcion.plan, suscripcion.vigenciaDias) ?? 0),
    planSiguiente: siguiente ? { codigo: siguiente.codigo, nombre: siguiente.nombre } : null,
  };
}

export function cotizacionDe(operacion: OperacionCobro, moneda: string): Cotizacion {
  return {
    tipo: operacion.tipo,
    desde: { codigo: operacion.desde.codigo, nombre: operacion.desde.nombre },
    plan: { codigo: operacion.destino.codigo, nombre: operacion.destino.nombre },
    vigenciaDias: operacion.vigenciaDias,
    monto: operacion.monto,
    moneda,
    inicio: operacion.inicio,
    vence: operacion.vence,
  };
}
