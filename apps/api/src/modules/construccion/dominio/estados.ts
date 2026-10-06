/**
 * Vocabulario del despliegue. Los valores son los del contrato y de `apps/web/.../estados.ts`.
 * Estados de despliegue ≠ estados de suscripción (§4.4).
 */
export const ESTADOS_DESPLIEGUE = [
  "encolado",
  "construyendo",
  "aprovisionando",
  "publicando",
  "saludable",
  "fallido",
  "cancelado",
  "detenido",
  "revirtiendo",
] as const;
export type EstadoDespliegue = (typeof ESTADOS_DESPLIEGUE)[number];

/** Las cinco etapas del ciclo, en el orden en que las pinta `RielEtapas`. */
export const ETAPAS = ["recepcion", "construccion", "ejecucion", "enrutamiento", "operacion"] as const;
export type Etapa = (typeof ETAPAS)[number];

export type EstadoEtapa = "pendiente" | "en-curso" | "completada" | "fallida" | "omitida";

export type NivelBitacora = "info" | "aviso" | "error";

export type DisparadorDespliegue = "alta" | "manual" | "reintento" | "redespliegue" | "reversion" | "variables";

/** La reversión reusa un artefacto: no construye ni cuenta contra el plan (I7). */
export const DISPARADOR_SIN_CONSTRUCCION: DisparadorDespliegue = "reversion";

export type PlanPipeline = "construccion" | "reversion";

export type RecetaConstruccion = "dockerfile" | "node" | "python" | "go" | "estatica";

export const ESTADOS_TERMINALES: readonly EstadoDespliegue[] = ["saludable", "fallido", "cancelado", "detenido"];

export function estaTerminado(estado: EstadoDespliegue): boolean {
  return ESTADOS_TERMINALES.includes(estado);
}
