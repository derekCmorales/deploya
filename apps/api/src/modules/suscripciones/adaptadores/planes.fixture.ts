import type { Plan } from "../dominio/plan";
import { planesSemilla } from "../semilla/semilla";

/** Los 4 planes del seed como filas de dominio, para las pruebas. */
export function planesDePrueba(): Plan[] {
  return planesSemilla().map((plan) => ({ ...plan, id: `plan-${plan.codigo}`, activo: true }));
}
