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

/** Pedido masivo sobre todos los proyectos de un cliente (M2 al suspender o renovar, M9 al suspender la cuenta). */
export type PedidoMasivo = "detener" | "reanudar";

/** Cuántos trabajos quedaron en la cola `operacion` tras un pedido masivo. */
export interface ResultadoMasivo {
  encolados: number;
}

interface ReglaMasiva {
  tipo: Exclude<TipoAccion, "eliminar">;
  /** Único estado del despliegue activo sobre el que actúa el pedido; los demás proyectos se omiten. */
  estado: EstadoDespliegue;
}

/** Tabla de reglas (OCP): un pedido nuevo es una fila, no una rama. Reanudar reutiliza `reiniciar`. */
export const REGLAS_MASIVAS: Readonly<Record<PedidoMasivo, ReglaMasiva>> = {
  detener: { tipo: "detener", estado: "saludable" },
  reanudar: { tipo: "reiniciar", estado: "detenido" },
};
