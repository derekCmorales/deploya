import type { Plan, PlanCatalogo } from "./plan";
import type { Cuota, Suscripcion } from "./suscripcion";

export function catalogoDe(planes: Plan[]): PlanCatalogo[] {
  return planes
    .filter((plan) => plan.activo)
    .sort((a, b) => a.orden - b.orden)
    .map(({ id: _id, orden: _orden, activo: _activo, ...visible }) => visible);
}

export function cuotaDeSuscripcion(suscripcion: Suscripcion): Cuota {
  const { plan } = suscripcion;
  return {
    plan: { codigo: plan.codigo, nombre: plan.nombre },
    estado: suscripcion.estado,
    vence: suscripcion.vence,
    maxProyectos: plan.maxProyectos,
    cpus: plan.cpus,
    memoriaMb: plan.memoriaMb,
    construccionesMes: plan.construccionesMes,
  };
}
