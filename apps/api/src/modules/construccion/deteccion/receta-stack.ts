import type { RecetaConstruccion } from "../dominio/estados";
import type { DockerfileReceta } from "./dockerfile-receta";
import type { MapaArchivos } from "./mapa-archivos";

/** Lo que el proyecto agrega a la receta (feat/m3-alta-guiada). */
export interface OpcionesReceta {
  /** Corre en forma shell (`RUN <comando>`); `null` = el paso de construcción por defecto de la receta. */
  comandoConstruccion: string | null;
}

export const SIN_OPCIONES: OpcionesReceta = { comandoConstruccion: null };

export interface DescripcionReceta {
  descripcion: string;
  evidencia: string[];
}

/**
 * Una forma de construir un stack (Strategy). Las recetas no hacen E/S: deciden sobre un
 * mapa de archivos ya leído, así la misma detección corre en el alta y en el trabajador.
 */
export abstract class RecetaStack {
  abstract readonly receta: RecetaConstruccion;
  /** Nombre corto para la bitácora: «Node.js 22». */
  abstract readonly nombre: string;
  abstract readonly archivosQueLee: readonly string[];
  /** Si la receta corre `comandoConstruccion`; con Dockerfile propio o sitio estático no aplica. */
  readonly aplicaComandoConstruccion: boolean = false;
  /** `USER` que agrega la capa sin privilegios; `null` si la base ya fija el suyo (Node) o no hay base. */
  abstract readonly usuarioFinal: string | null;
  abstract reconoce(archivos: MapaArchivos): boolean;
  abstract describir(archivos: MapaArchivos): DescripcionReceta;
  /** La base del `Dockerfile.deploya`, sin capas comunes; `null` si se usa el del repositorio. */
  abstract dockerfile(archivos: MapaArchivos, opciones?: OpcionesReceta): DockerfileReceta | null;
  abstract puertoSugerido(archivos: MapaArchivos): number;

  /** Qué le falta al repositorio para que esta receta lo reconozca, si casi lo hace. */
  pista(_archivos: MapaArchivos): string | null {
    return null;
  }
}
