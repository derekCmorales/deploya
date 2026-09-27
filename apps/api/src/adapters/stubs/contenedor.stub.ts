import { Injectable } from "@nestjs/common";
import {
  ContenedorPuerto,
  type ContenedorCreado,
  type EspecContenedor,
} from "../../modules/orquestacion/puertos/contenedor.puerto";

@Injectable()
export class ContenedorStub extends ContenedorPuerto {
  readonly creados: EspecContenedor[] = [];
  readonly detenidos: string[] = [];
  readonly eliminados: string[] = [];

  async crear(espec: EspecContenedor): Promise<ContenedorCreado> {
    this.creados.push(espec);
    return { id: `contenedor-${espec.nombre}`, host: espec.nombre };
  }

  async detener(contenedorId: string): Promise<void> {
    this.detenidos.push(contenedorId);
  }

  async eliminar(contenedorId: string): Promise<void> {
    this.eliminados.push(contenedorId);
  }
}
