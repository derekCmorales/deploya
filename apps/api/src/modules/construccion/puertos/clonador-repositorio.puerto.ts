import type { Commit } from "../dominio/despliegue";

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

/** Clona una rama pública con profundidad 1. Lanza `ClonFallido`. */
export abstract class ClonadorRepositorioPuerto {
  abstract clonar(solicitud: SolicitudClon): Promise<ClonListo>;
  abstract existeArchivo(directorio: string, ruta: string): Promise<boolean>;
  abstract limpiar(directorio: string): Promise<void>;
}
