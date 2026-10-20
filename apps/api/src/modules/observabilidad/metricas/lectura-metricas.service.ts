import { Injectable } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import { ProyectoNoEncontrado } from "../../construccion/dominio/errores";
import { RepositorioDespliegues } from "../../construccion/puertos/repositorio-despliegues.puerto";
import { CuotaPlanPuerto } from "../../orquestacion/puertos/cuota-plan.puerto";
import { MuestrasMetricas } from "../../orquestacion/puertos/muestras-metricas.puerto";
import { DetalleProyectoPuerto } from "../puertos/detalle-proyecto.puerto";
import { desdeDe, respuestaMetricas, type RangoMetricas, type RespuestaMetricas } from "./dominio/serie-metricas";

/**
 * Lectura de `GET /proyectos/:id/metricas` (CQRS): no mide ni escribe.
 * El límite sale de `CuotaPlanPuerto`; en autoalojado ese puerto lo alimenta
 * `LimitesDeInstalacion`, así que aquí no hay un modo que distinguir.
 */
@Injectable()
export class LecturaMetricasService {
  constructor(
    private readonly proyectos: DetalleProyectoPuerto,
    private readonly cuota: CuotaPlanPuerto,
    private readonly despliegues: RepositorioDespliegues,
    private readonly muestras: MuestrasMetricas,
    private readonly reloj: Reloj,
  ) {}

  async leer(proyectoId: string, usuarioId: string, rango: RangoMetricas): Promise<RespuestaMetricas> {
    await this.exigirDueno(proyectoId, usuarioId);
    const ahora = this.reloj.ahora();
    const desde = desdeDe(ahora, rango);
    const [recursos, activo, muestras, entradas] = await Promise.all([
      this.cuota.recursosDe(usuarioId),
      this.despliegues.activoDe(proyectoId),
      this.muestras.deProyecto(proyectoId, desde),
      this.despliegues.entraronDesde(proyectoId, desde),
    ]);
    return respuestaMetricas({ recursos, activo, muestras, entradas, rango, ahora });
  }

  private async exigirDueno(proyectoId: string, usuarioId: string): Promise<void> {
    const proyecto = await this.proyectos.porId(proyectoId);
    if (!proyecto || proyecto.usuarioId !== usuarioId) throw new ProyectoNoEncontrado(proyectoId);
  }
}
