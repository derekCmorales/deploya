import { Injectable } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import { RepositorioDespliegues } from "../../construccion/puertos/repositorio-despliegues.puerto";
import { ProyectoNoEncontrado } from "../../construccion/dominio/errores";
import { DetalleProyectoPuerto } from "../puertos/detalle-proyecto.puerto";
import { agruparPorDia, inicioVentanaActividad, type ActividadDia } from "../dominio/actividad";

export interface ActividadProyectoDto {
  dias: ActividadDia[];
  total: number;
  fallidos: number;
}

@Injectable()
export class ActividadService {
  constructor(
    private readonly reloj: Reloj,
    private readonly despliegues: RepositorioDespliegues,
    private readonly proyectos: DetalleProyectoPuerto,
  ) {}

  async de(proyectoId: string, usuarioId: string): Promise<ActividadProyectoDto> {
    const proyecto = await this.proyectos.porId(proyectoId);
    if (!proyecto || proyecto.usuarioId !== usuarioId) {
      throw new ProyectoNoEncontrado(proyectoId);
    }

    const hoy = this.reloj.ahora();
    const desde = inicioVentanaActividad(hoy);
    const muestras = await this.despliegues.desplieguesDesde(proyectoId, desde);

    const dias = agruparPorDia(muestras, hoy);
    const total = dias.reduce((acc, d) => acc + d.total, 0);
    const fallidos = dias.reduce((acc, d) => acc + d.fallidos, 0);

    return { dias, total, fallidos };
  }
}