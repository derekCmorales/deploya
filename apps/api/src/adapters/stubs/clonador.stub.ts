import { Injectable } from "@nestjs/common";
import type { Commit } from "../../modules/construccion/dominio/despliegue";
import {
  ClonadorRepositorioPuerto,
  type ClonListo,
  type SolicitudClon,
} from "../../modules/construccion/puertos/clonador-repositorio.puerto";
import { LectorFuente } from "../../modules/construccion/puertos/lector-fuente.puerto";

/** Lector sobre un mapa de archivos en memoria (mismo contrato que `LectorFuenteLocal`). */
export class LectorFuenteMemoria extends LectorFuente {
  constructor(private readonly archivos: ReadonlyMap<string, string>) {
    super();
  }

  async existe(ruta: string): Promise<boolean> {
    return this.archivos.has(ruta);
  }

  async leer(ruta: string): Promise<string | null> {
    return this.archivos.get(ruta) ?? null;
  }
}

/** Clon falso: devuelve un commit fijo y los archivos configurados (por defecto, un Dockerfile). */
@Injectable()
export class ClonadorStub extends ClonadorRepositorioPuerto {
  commit: Commit = { sha: "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678", mensaje: "feat: demo", autor: "Deploya" };
  archivos = new Map<string, string>([["Dockerfile", "FROM node:22-alpine\nEXPOSE 8080\n"]]);
  error: Error | null = null;
  readonly escritos: { directorio: string; ruta: string; contenido: string }[] = [];
  readonly limpiados: string[] = [];

  async clonar(solicitud: SolicitudClon): Promise<ClonListo> {
    if (this.error) throw this.error;
    return { directorio: `/tmp/deploya/${solicitud.despliegueId}`, commit: this.commit };
  }

  lector(): LectorFuente {
    return new LectorFuenteMemoria(this.archivos);
  }

  async escribir(directorio: string, ruta: string, contenido: string): Promise<void> {
    this.escritos.push({ directorio, ruta, contenido });
  }

  async limpiar(directorio: string): Promise<void> {
    this.limpiados.push(directorio);
  }
}
