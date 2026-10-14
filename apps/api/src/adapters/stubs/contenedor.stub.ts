import { Injectable } from "@nestjs/common";
import {
  ContenedorPuerto,
  type ContenedorCreado,
  type EspecContenedor,
} from "../../modules/orquestacion/puertos/contenedor.puerto";

@Injectable()
export class ContenedorStub extends ContenedorPuerto {
  readonly creados: EspecContenedor[] = [];
  readonly iniciados: string[] = [];
  readonly detenidos: string[] = [];
  readonly eliminados: string[] = [];
  readonly proyectosLimpiados: string[] = [];
  readonly imagenesBorradas: string[] = [];
  readonly imagenesRetiradas: string[] = [];
  /** Imágenes cuyo borrado falla (para probar que la retención no rompe el despliegue). */
  readonly imagenesQueFallan = new Set<string>();

  async crear(espec: EspecContenedor): Promise<ContenedorCreado> {
    this.creados.push(espec);
    return { id: `contenedor-${espec.nombre}`, host: espec.nombre };
  }

  async iniciar(contenedorId: string): Promise<void> {
    this.iniciados.push(contenedorId);
  }

  async detener(contenedorId: string): Promise<void> {
    this.detenidos.push(contenedorId);
  }

  async eliminar(contenedorId: string): Promise<void> {
    this.eliminados.push(contenedorId);
  }

  async eliminarContenedoresDe(subdominio: string): Promise<void> {
    this.proyectosLimpiados.push(subdominio);
  }

  async eliminarImagen(imagen: string): Promise<void> {
    if (this.imagenesQueFallan.has(imagen)) throw new Error(`No se pudo borrar ${imagen}`);
    this.imagenesRetiradas.push(imagen);
  }

  async eliminarImagenesDe(subdominio: string): Promise<void> {
    this.imagenesBorradas.push(subdominio);
  }
}
