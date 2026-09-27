import { Injectable } from "@nestjs/common";
import type { Commit } from "../../modules/construccion/dominio/despliegue";
import {
  ClonadorRepositorioPuerto,
  type ClonListo,
  type SolicitudClon,
} from "../../modules/construccion/puertos/clonador-repositorio.puerto";

/** Clon falso: devuelve un commit fijo y dice qué archivos «existen». */
@Injectable()
export class ClonadorStub extends ClonadorRepositorioPuerto {
  commit: Commit = { sha: "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678", mensaje: "feat: demo", autor: "Deploya" };
  archivos = new Set<string>(["Dockerfile"]);
  error: Error | null = null;
  readonly limpiados: string[] = [];

  async clonar(solicitud: SolicitudClon): Promise<ClonListo> {
    if (this.error) throw this.error;
    return { directorio: `/tmp/deploya/${solicitud.despliegueId}`, commit: this.commit };
  }

  async existeArchivo(_directorio: string, ruta: string): Promise<boolean> {
    return this.archivos.has(ruta);
  }

  async limpiar(directorio: string): Promise<void> {
    this.limpiados.push(directorio);
  }
}
