import { Injectable } from "@nestjs/common";
import { ProyectoNoEncontrado } from "../../construccion/dominio/errores";
import { RepositorioDespliegues } from "../../construccion/puertos/repositorio-despliegues.puerto";
import { DetalleProyectoPuerto } from "../puertos/detalle-proyecto.puerto";
import { SalidaContenedorPuerto } from "../puertos/salida-contenedor.puerto";
import {
  AVISO_CONTENEDOR_DETENIDO,
  AVISO_SIN_CONTENEDOR,
  lineasEjecucion,
  MAX_LINEAS_EJECUCION,
  type RespuestaBitacora,
} from "./dominio/bitacora-ejecucion";
import { BitacoraNoDisponible } from "./errores";

/**
 * `GET /proyectos/:id/bitacora` (SP-12): lee la salida del contenedor del despliegue activo y no
 * la guarda. Un contenedor detenido todavía se puede leer; el aviso lo dice.
 */
@Injectable()
export class BitacoraEjecucionService {
  constructor(
    private readonly proyectos: DetalleProyectoPuerto,
    private readonly despliegues: RepositorioDespliegues,
    private readonly salida: SalidaContenedorPuerto,
  ) {}

  async leer(proyectoId: string, usuarioId: string, desde: Date | null): Promise<RespuestaBitacora> {
    const proyecto = await this.proyectos.porId(proyectoId);
    if (!proyecto || proyecto.usuarioId !== usuarioId) throw new ProyectoNoEncontrado(proyectoId);
    const activo = await this.despliegues.activoDe(proyectoId);
    if (!activo?.contenedorId) return { despliegue: null, lineas: [], aviso: AVISO_SIN_CONTENEDOR };

    const salida = await this.leerSalida(activo.contenedorId, desde);
    return {
      despliegue: { numero: activo.numero, commit: activo.commit?.sha ?? null },
      lineas: lineasEjecucion(salida, desde),
      aviso: activo.estado === "saludable" ? null : AVISO_CONTENEDOR_DETENIDO,
    };
  }

  private async leerSalida(contenedorId: string, desde: Date | null) {
    try {
      return await this.salida.leer(contenedorId, { desde, max: MAX_LINEAS_EJECUCION });
    } catch (error) {
      throw new BitacoraNoDisponible(error instanceof Error ? error.message : String(error));
    }
  }
}
