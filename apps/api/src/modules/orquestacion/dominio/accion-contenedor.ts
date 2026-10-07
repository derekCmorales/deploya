import type { EstadoDespliegue } from "../../construccion/dominio/estados";
import { AccionNoPermitida } from "./errores";

export type TipoAccion = "reiniciar" | "detener" | "eliminar";

/**
 * Comando serializable que viaja por la cola `operacion` (patrón Command): la API dice qué
 * hacer y el trabajador lo ejecuta. Lleva el subdominio porque al eliminar el proyecto ya no existe.
 */
export interface AccionContenedor {
  tipo: TipoAccion;
  proyectoId: string;
  subdominio: string;
}

/** Estados del despliegue activo desde los que el cliente puede pedir cada acción. */
const ESTADOS_PERMITIDOS: Readonly<Record<Exclude<TipoAccion, "eliminar">, readonly EstadoDespliegue[]>> = {
  reiniciar: ["saludable", "detenido"],
  detener: ["saludable"],
};

export function accionPermitida(tipo: Exclude<TipoAccion, "eliminar">, estado: EstadoDespliegue): boolean {
  return ESTADOS_PERMITIDOS[tipo].includes(estado);
}

export function exigirAccionPermitida(tipo: Exclude<TipoAccion, "eliminar">, estado: EstadoDespliegue): void {
  if (!accionPermitida(tipo, estado)) throw new AccionNoPermitida(tipo, estado);
}
