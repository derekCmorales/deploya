import type {
  ConceptoPago as ConceptoPagoFila,
  EstadoSuscripcion,
  Pago as PagoFila,
  Plan as PlanFila,
  Prisma,
  Suscripcion as SuscripcionFila,
} from "@prisma/client";
import type { PagoHistorial } from "../dominio/comprobante";
import type { ConceptoPago, Pago } from "../dominio/pago";
import type { Plan } from "../dominio/plan";
import type { EstadoSuscripcionValor, Suscripcion } from "../dominio/suscripcion";

/** Enums de Prisma usan `_` donde la API usa `-` (`por_vencer` ↔ `por-vencer`). */
export function estadoDesdePrisma(estado: EstadoSuscripcion): EstadoSuscripcionValor {
  return estado.replaceAll("_", "-") as EstadoSuscripcionValor;
}

export function estadoAPrisma(estado: EstadoSuscripcionValor): EstadoSuscripcion {
  return estado.replaceAll("-", "_") as EstadoSuscripcion;
}

function numeroDe(decimal: Prisma.Decimal): number {
  return decimal.toNumber();
}

export function planDesdePrisma(fila: PlanFila): Plan {
  return {
    id: fila.id,
    codigo: fila.codigo,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    precio30: numeroDe(fila.precio30),
    precio365: fila.precio365 === null ? null : numeroDe(fila.precio365),
    maxProyectos: fila.maxProyectos,
    cpus: numeroDe(fila.cpus),
    memoriaMb: fila.memoriaMb,
    construccionesMes: fila.construccionesMes,
    orden: fila.orden,
    activo: fila.activo,
  };
}

/** La fila con sus planes; `planSiguiente` falta si la consulta no lo incluyó. */
export type SuscripcionConPlanes = SuscripcionFila & { plan: PlanFila; planSiguiente?: PlanFila | null };

export const INCLUIR_PLANES = { plan: true, planSiguiente: true } as const;

export function suscripcionDesdePrisma(fila: SuscripcionConPlanes): Suscripcion {
  return {
    id: fila.id,
    usuarioId: fila.usuarioId,
    plan: planDesdePrisma(fila.plan),
    estado: estadoDesdePrisma(fila.estado),
    estadoDesde: fila.estadoDesde,
    vigenciaDias: fila.vigenciaDias,
    inicio: fila.inicio,
    vence: fila.vence,
    planSiguiente: fila.planSiguiente ? planDesdePrisma(fila.planSiguiente) : null,
  };
}

export function conceptoAPrisma(concepto: ConceptoPago): ConceptoPagoFila {
  return concepto.replaceAll("-", "_") as ConceptoPagoFila;
}

export function pagoDesdePrisma(fila: PagoFila): Pago {
  return {
    id: fila.id,
    usuarioId: fila.usuarioId,
    suscripcionId: fila.suscripcionId,
    planId: fila.planId,
    concepto: fila.concepto.replaceAll("_", "-") as ConceptoPago,
    vigenciaDias: fila.vigenciaDias,
    monto: numeroDe(fila.monto),
    moneda: fila.moneda,
    estado: fila.estado,
    motivoRechazo: fila.motivoRechazo,
    tarjetaUltimos4: fila.tarjetaUltimos4,
    numeroComprobante: fila.numeroComprobante,
    creado: fila.creado,
  };
}

/** Lo que el historial (M2-06) lee junto al pago: el nombre del plan y el titular de la cuenta con su correo. */
export const INCLUIR_HISTORIAL = { plan: { select: { nombre: true } }, usuario: { select: { nombre: true, correo: true } } } as const;

export type PagoConPlanYTitular = PagoFila & { plan: { nombre: string }; usuario: { nombre: string; correo: string } };

export function pagoHistorialDesdePrisma(fila: PagoConPlanYTitular): PagoHistorial {
  return { ...pagoDesdePrisma(fila), planNombre: fila.plan.nombre, titular: fila.usuario.nombre, correo: fila.usuario.correo };
}
