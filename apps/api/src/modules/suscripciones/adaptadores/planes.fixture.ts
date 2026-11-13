import type { Plan } from "../dominio/plan";
import type { PlanSemilla } from "../semilla/semilla";

/**
 * Cuatro planes fijos para las pruebas de políticas y servicios. No salen del seed: un cambio de
 * tarifa (semilla.spec lo verifica) no debe reescribir los escenarios de ascenso, cotización o ciclo.
 */
const PLANES_FIJOS: PlanSemilla[] = [
  { codigo: "sandbox", nombre: "Sandbox", descripcion: "Para probar deploya con un proyecto.", precio30: 0, precio365: null, maxProyectos: 1, cpus: 0.25, memoriaMb: 256, construccionesMes: 30, maxRecursosDatos: 1, discoDatosMb: 512, orden: 1 },
  { codigo: "starter", nombre: "Starter", descripcion: "Para un servicio pequeño en producción.", precio30: 5, precio365: 50, maxProyectos: 3, cpus: 0.5, memoriaMb: 512, construccionesMes: 150, maxRecursosDatos: 3, discoDatosMb: 2_048, orden: 2 },
  { codigo: "pro", nombre: "Pro", descripcion: "Para varios servicios pequeños.", precio30: 15, precio365: 150, maxProyectos: 10, cpus: 1, memoriaMb: 1024, construccionesMes: 500, maxRecursosDatos: 10, discoDatosMb: 10_240, orden: 3 },
  { codigo: "business", nombre: "Business", descripcion: "Para servicios con más carga.", precio30: 40, precio365: 400, maxProyectos: 25, cpus: 2, memoriaMb: 2048, construccionesMes: 2000, maxRecursosDatos: 25, discoDatosMb: 25_600, orden: 4 },
];

/** Los 4 planes de prueba como filas de dominio. */
export function planesDePrueba(): Plan[] {
  return PLANES_FIJOS.map((plan) => ({ ...plan, id: `plan-${plan.codigo}`, activo: true }));
}
