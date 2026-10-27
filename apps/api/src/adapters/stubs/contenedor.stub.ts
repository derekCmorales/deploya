import { Injectable } from "@nestjs/common";
import {
  ContenedorPuerto,
  type ConsultaSalida,
  type ContenedorCreado,
  type EspecContenedor,
  type LineaSalida,
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

  /** Salida de cada contenedor por id: la prueba la llena para simular que la app imprime (SP-12). */
  readonly salidas = new Map<string, LineaSalida[]>();

  /** Gancho para simular un evento externo (p. ej. una cancelación) justo cuando se crea el contenedor. */
  alCrear: (() => Promise<void>) | null = null;

  async crear(espec: EspecContenedor): Promise<ContenedorCreado> {
    this.creados.push(espec);
    await this.alCrear?.();
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

  async bitacora(contenedorId: string, { desde, max }: ConsultaSalida): Promise<LineaSalida[]> {
    const lineas = (this.salidas.get(contenedorId) ?? []).filter((l) => !desde || l.marca > desde);
    return lineas.slice(-max);
  }
}
