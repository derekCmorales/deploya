import { Injectable } from "@nestjs/common";
import { ProyectoNoEncontrado } from "../../construccion/dominio/errores";
import type { TiemposDespliegue } from "../../construccion/dominio/tiempos-despliegue";
import { RepositorioDespliegues } from "../../construccion/puertos/repositorio-despliegues.puerto";
import { DetalleProyectoPuerto } from "../puertos/detalle-proyecto.puerto";
import { resumenTiempos, type ResumenTiempos } from "./dominio/tiempos.dominio";

/** Los últimos 14 despliegues son los que muestra la tarjeta 14c. */
export const ULTIMOS_DESPLIEGUES = 14;
const PRIMER_DESPLIEGUE = 1;

/** Cuerpo de `GET /proyectos/:id/despliegues/tiempos?ultimos=14`. */
export interface RespuestaTiempos {
  despliegues: TiemposDespliegue[];
  resumen: ResumenTiempos;
}

/** El query `ultimos` vale 14 por defecto y nunca supera los 14 de la pantalla. */
export function ultimosDe(valor: string | undefined): number {
  const pedidos = Number(valor);
  if (!Number.isInteger(pedidos) || pedidos < PRIMER_DESPLIEGUE) return ULTIMOS_DESPLIEGUES;
  return Math.min(pedidos, ULTIMOS_DESPLIEGUES);
}

/**
 * Lectura de los tiempos por etapa (CQRS): no escribe ni mide. El dueño se comprueba
 * con `DetalleProyectoPuerto` y los tiempos los expone el repositorio de M4.
 */
@Injectable()
export class TiemposService {
  constructor(
    private readonly proyectos: DetalleProyectoPuerto,
    private readonly despliegues: RepositorioDespliegues,
  ) {}

  async leer(proyectoId: string, usuarioId: string, ultimos: number = ULTIMOS_DESPLIEGUES): Promise<RespuestaTiempos> {
    await this.exigirDueno(proyectoId, usuarioId);
    const despliegues = await this.despliegues.tiemposDe(proyectoId, ultimos);
    return { despliegues, resumen: resumenTiempos(despliegues) };
  }

  private async exigirDueno(proyectoId: string, usuarioId: string): Promise<void> {
    const proyecto = await this.proyectos.porId(proyectoId);
    if (!proyecto || proyecto.usuarioId !== usuarioId) throw new ProyectoNoEncontrado(proyectoId);
  }
}
