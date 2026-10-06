import type { Commit } from "../dominio/despliegue";
import type { LectorFuente } from "./lector-fuente.puerto";

export interface SolicitudClon {
  url: string;
  rama: string;
  despliegueId: string;
  commitSha?: string;
}

export interface ClonListo {
  directorio: string;
  commit: Commit;
}

/** Clona una rama pública con profundidad 1 y da acceso a sus archivos. Lanza `ClonFallido`. */
export abstract class ClonadorRepositorioPuerto {
  abstract clonar(solicitud: SolicitudClon): Promise<ClonListo>;
  /** Lector del clon para la detección de stack (M4-03). */
  abstract lector(directorio: string): LectorFuente;
  /** Escribe el `Dockerfile.deploya` de una receta dentro del clon. */
  abstract escribir(directorio: string, ruta: string, contenido: string): Promise<void>;
  abstract limpiar(directorio: string): Promise<void>;
}
