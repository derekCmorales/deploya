import type { Plan } from "./plan";

/** Valores de la API; los mismos de `apps/web/src/components/deploya/estados.ts`. */
export type EstadoSuscripcionValor = "activa" | "por-vencer" | "vencida" | "suspendida" | "cancelada";

export interface Suscripcion {
  id: string;
  usuarioId: string;
  plan: Plan;
  estado: EstadoSuscripcionValor;
  vigenciaDias: number | null;
  inicio: Date;
  vence: Date | null;
  /** Descenso programado: aplica al terminar la vigencia (M2-05). */
  planSiguiente: Plan | null;
}

export interface NuevaSuscripcion {
  usuarioId: string;
  planId: string;
  estado: EstadoSuscripcionValor;
  vigenciaDias: number | null;
  inicio: Date;
  vence: Date | null;
}

/** Lo que cambia al aprobar un pago o al programar un descenso. */
export interface CambioSuscripcion {
  planId: string;
  estado: EstadoSuscripcionValor;
  estadoDesde: Date;
  vigenciaDias: number | null;
  inicio: Date;
  vence: Date | null;
  planSiguienteId: string | null;
}

/** Contrato de `cuotaDe` para M1, M3, M4 y M5 (docs/contratos/datos-nucleo.md). */
export interface Cuota {
  plan: { codigo: string; nombre: string };
  estado: EstadoSuscripcionValor;
  vence: Date | null;
  maxProyectos: number;
  cpus: number;
  memoriaMb: number;
  construccionesMes: number;
}
