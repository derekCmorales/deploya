import type { ContenedorCreado } from "../../orquestacion/puertos/contenedor.puerto";
import type { Commit, Despliegue, ProyectoDesplegable } from "../dominio/despliegue";
import type { EstadoDespliegue, Etapa, NivelBitacora, PlanPipeline, RecetaConstruccion } from "../dominio/estados";

export interface Bitacora {
  escribir(etapa: Etapa, texto: string, nivel?: NivelBitacora): void;
}

/** Lo que los pasos se van pasando durante un despliegue. */
export interface ContextoDespliegue {
  despliegue: Despliegue;
  proyecto: ProyectoDesplegable;
  bitacora: Bitacora;
  /** Se aborta cuando el cliente cancela; los pasos largos (clonar, construir) la respetan. */
  senal: AbortSignal;
  directorio?: string;
  commit?: Commit;
  /** Lo decide la detección de stack en Recepción; Construcción lo usa. */
  receta?: RecetaConstruccion;
  rutaDockerfile?: string;
  imagen?: string;
  contenedor?: ContenedorCreado;
  url?: string;
}

/**
 * Un paso por etapa (Chain of Responsibility). El pipeline pone el despliegue en
 * `estado`, marca la etapa y llama a `ejecutar`. Si un paso posterior falla, llama a
 * `compensar` de los que ya corrieron, en orden inverso; `liberar` corre siempre.
 */
export abstract class PasoPipeline {
  abstract readonly etapa: Etapa;
  abstract readonly estado: EstadoDespliegue;

  abstract ejecutar(contexto: ContextoDespliegue): Promise<void>;

  async compensar(_contexto: ContextoDespliegue): Promise<void> {
    return;
  }

  async liberar(_contexto: ContextoDespliegue): Promise<void> {
    return;
  }
}

/** Cada plan es una lista ordenada de pasos (Strategy): un plan nuevo no toca los pasos ni el pipeline. */
export type PlanesPipeline = Readonly<Record<PlanPipeline, readonly PasoPipeline[]>>;

/** Token de Nest con los planes del trabajador: `construccion` y `reversion`. */
export const PLANES_PIPELINE = Symbol("PLANES_PIPELINE");
