import type { Commit, Despliegue, LineaBitacora } from "../dominio/despliegue";
import type { DisparadorDespliegue, EstadoDespliegue, EstadoEtapa, Etapa } from "../dominio/estados";

export interface NuevoDespliegue {
  proyectoId: string;
  disparador: DisparadorDespliegue;
  rama: string;
  estado: EstadoDespliegue;
  creado: Date;
}

export interface CambiosDespliegue {
  commit?: Commit;
  artefactoId?: string;
  contenedorId?: string;
  url?: string;
  cpus?: number;
  memoriaMb?: number;
  codigoSalida?: number | null;
  motivoFallo?: string;
  terminado?: Date;
}

/**
 * Persistencia del agregado Despliegue (etapas y bitácora incluidas).
 * `crear` asigna `numero = máximo del proyecto + 1` y las cinco etapas en Pendiente.
 */
export abstract class RepositorioDespliegues {
  abstract crear(nuevo: NuevoDespliegue): Promise<Despliegue>;
  abstract porId(id: string): Promise<Despliegue | null>;
  /** El despliegue #`numero` del proyecto (pantalla 12 abre por número). */
  abstract porNumero(proyectoId: string, numero: number): Promise<Despliegue | null>;
  abstract cambiarEstado(id: string, estado: EstadoDespliegue, cambios?: CambiosDespliegue): Promise<void>;
  abstract marcarEtapa(id: string, etapa: Etapa, estado: EstadoEtapa, marca: Date): Promise<void>;
  abstract agregarLineas(id: string, lineas: LineaBitacora[]): Promise<void>;
  abstract lineasDesde(id: string, desde: number, limite: number): Promise<LineaBitacora[]>;
  /** El despliegue más reciente de cada proyecto pedido (para la lista de M3). */
  abstract ultimosDe(proyectoIds: string[]): Promise<Despliegue[]>;
  abstract activoDe(proyectoId: string): Promise<Despliegue | null>;
  abstract marcarActivo(proyectoId: string, despliegueId: string): Promise<void>;
  /**
   * Construcciones del usuario desde `desde` (invariante I7): todos sus despliegues creados
   * desde esa fecha salvo los de `reversion`, que no construyen. Terminen como terminen.
   */
  abstract contarConstruccionesDesde(usuarioId: string, desde: Date): Promise<number>;
}
