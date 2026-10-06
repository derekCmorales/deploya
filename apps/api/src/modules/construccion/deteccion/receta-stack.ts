import type { RecetaConstruccion } from "../dominio/estados";
import type { MapaArchivos } from "./mapa-archivos";

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
  abstract reconoce(archivos: MapaArchivos): boolean;
  abstract describir(archivos: MapaArchivos): DescripcionReceta;
  /** El `Dockerfile.deploya` que genera la receta; `null` si se usa el del repositorio. */
  abstract dockerfile(archivos: MapaArchivos): string | null;
  abstract puertoSugerido(archivos: MapaArchivos): number;

  /** Qué le falta al repositorio para que esta receta lo reconozca, si casi lo hace. */
  pista(_archivos: MapaArchivos): string | null {
    return null;
  }
}
