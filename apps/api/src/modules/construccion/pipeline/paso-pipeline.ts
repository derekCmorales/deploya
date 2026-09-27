import type { ContenedorCreado } from "../../orquestacion/puertos/contenedor.puerto";
import type { Commit, Despliegue, ProyectoDesplegable } from "../dominio/despliegue";
import type { EstadoDespliegue, Etapa, NivelBitacora } from "../dominio/estados";

export interface Bitacora {
  escribir(etapa: Etapa, texto: string, nivel?: NivelBitacora): void;
}

/** Lo que los pasos se van pasando durante un despliegue. */
export interface ContextoDespliegue {
  despliegue: Despliegue;
  proyecto: ProyectoDesplegable;
  bitacora: Bitacora;
  directorio?: string;
  commit?: Commit;
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

/** Token de Nest con la lista ordenada de pasos del plan `construccion`. */
export const PASOS_CONSTRUCCION = Symbol("PASOS_CONSTRUCCION");
