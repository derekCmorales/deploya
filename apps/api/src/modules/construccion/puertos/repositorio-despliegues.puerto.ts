import type { Commit, Despliegue, LineaBitacora } from "../dominio/despliegue";
import type { FiltroHistorial } from "../dominio/historial";
import type { DisparadorDespliegue, EstadoDespliegue, EstadoEtapa, Etapa } from "../dominio/estados";
import type { TiemposDespliegue } from "../dominio/tiempos-despliegue";

export interface NuevoDespliegue {
  proyectoId: string;
  disparador: DisparadorDespliegue;
  rama: string;
  estado: EstadoDespliegue;
  creado: Date;
  /** Solo la reversión: el artefacto que reusa y el commit con el que se construyó. */
  artefactoId?: string;
  commit?: Commit;
  /** Etapas que este despliegue no recorre (Recepción y Construcción en una reversión). */
  etapasOmitidas?: readonly Etapa[];
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

/** Lo mínimo de un despliegue para el mapa de actividad (M7-03). */
export interface MuestraDespliegue {
  creado: Date;
  estado: EstadoDespliegue;
}

/** Activo Saludable con contenedor: lo único que el muestreo mide. */
export interface DespliegueMuestreable {
  despliegueId: string;
  contenedorId: string;
}

/** Número y hora de un despliegue que entró en la ventana de la gráfica. */
export interface EntradaVentana {
  numero: number;
  creado: Date;
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
  /** El primer despliegue del proyecto que clonó ese commit, si lo hay (redesplegar, M4-02). */
  abstract porCommit(proyectoId: string, commitSha: string): Promise<Despliegue | null>;
  abstract cambiarEstado(id: string, estado: EstadoDespliegue, cambios?: CambiosDespliegue): Promise<void>;
  abstract marcarEtapa(id: string, etapa: Etapa, estado: EstadoEtapa, marca: Date): Promise<void>;
  abstract agregarLineas(id: string, lineas: LineaBitacora[]): Promise<void>;
  abstract lineasDesde(id: string, desde: number, limite: number): Promise<LineaBitacora[]>;
  /** Las `cuantas` últimas líneas, en orden de `n` (el correo de un despliegue fallido, SP-08). */
  abstract ultimasLineas(id: string, cuantas: number): Promise<LineaBitacora[]>;
  /** El despliegue más reciente de cada proyecto pedido (para la lista de M3). */
  abstract ultimosDe(proyectoIds: string[]): Promise<Despliegue[]>;
  abstract activoDe(proyectoId: string): Promise<Despliegue | null>;
  /**
   * Hasta `limite` despliegues del proyecto del #n más reciente al más antiguo, con `numero < antesDe`
   * si hay cursor. El filtro `saludables` / `fallidos` mira el estado guardado (pantalla 14).
   */
  abstract historialDe(proyectoId: string, filtro: FiltroHistorial, antesDe: number | null, limite: number): Promise<Despliegue[]>;
  /** El despliegue que aún no terminó (Encolado, Construyendo, Revirtiendo, Aprovisionando o Publicando), si lo hay. */
  abstract enCursoDe(proyectoId: string): Promise<Despliegue | null>;
  abstract marcarActivo(proyectoId: string, despliegueId: string): Promise<void>;
  /**
   * Construcciones del usuario desde `desde` (invariante I7): todos sus despliegues creados
   * desde esa fecha salvo los de `reversion`, que no construyen. Terminen como terminen.
   */
  abstract contarConstruccionesDesde(usuarioId: string, desde: Date): Promise<number>;

  /**
   * Fecha y estado de cada despliegue del proyecto creado desde `desde`, reversiones incluidas:
   * la actividad cuenta despliegues, no construcciones (pantalla 13).
   */
  abstract desplieguesDesde(proyectoId: string, desde: Date): Promise<MuestraDespliegue[]>;

  /**
   * Los últimos `ultimos` despliegues, del más antiguo al más reciente.
   * Duración por etapa en ms; etapa omitida o posterior al fallo = 0.
   */
  abstract tiemposDe(proyectoId: string, ultimos: number): Promise<TiemposDespliegue[]>;

  /** Un elemento por proyecto cuyo despliegue activo está Saludable y tiene contenedor. */
  abstract activosSaludables(): Promise<DespliegueMuestreable[]>;

  /** Despliegues creados desde `desde`, para los chips de la gráfica. */
  abstract entraronDesde(proyectoId: string, desde: Date): Promise<EntradaVentana[]>;
}
