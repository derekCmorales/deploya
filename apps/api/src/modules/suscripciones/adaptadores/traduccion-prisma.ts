import type { EstadoSuscripcion, Plan as PlanFila, Prisma, Suscripcion as SuscripcionFila } from "@prisma/client";
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

export function suscripcionDesdePrisma(fila: SuscripcionFila & { plan: PlanFila }): Suscripcion {
  return {
    id: fila.id,
    usuarioId: fila.usuarioId,
    plan: planDesdePrisma(fila.plan),
    estado: estadoDesdePrisma(fila.estado),
    vigenciaDias: fila.vigenciaDias,
    inicio: fila.inicio,
    vence: fila.vence,
  };
}
