import { Injectable } from "@nestjs/common";
import { ProyectoNoEncontrado } from "../../construccion/dominio/errores";
import { ProyectosLecturaPuerto } from "../../construccion/puertos/proyectos-lectura.puerto";
import { RepositorioDespliegues } from "../../construccion/puertos/repositorio-despliegues.puerto";
import { exigirAccionPermitida, type TipoAccion } from "../dominio/accion-contenedor";
import { SinDespliegueActivo } from "../dominio/errores";
import { ColaOperacionPuerto } from "../puertos/cola-operacion.puerto";

/** Lo que M3 entrega para borrar los recursos de un proyecto eliminado. */
export interface ProyectoAEliminar {
  id: string;
  subdominio: string;
}

/**
 * Facade de M5 en la API (M5-02): valida y encola; nunca toca Docker. El resultado llega a la
 * web por `GET /despliegues/:id` (por eso las rutas responden 202).
 */
@Injectable()
export class AccionesProyectoService {
  constructor(
    private readonly proyectos: ProyectosLecturaPuerto,
    private readonly despliegues: RepositorioDespliegues,
    private readonly cola: ColaOperacionPuerto,
  ) {}

  reiniciar(proyectoId: string, usuarioId: string): Promise<void> {
    return this.pedir("reiniciar", proyectoId, usuarioId);
  }

  detener(proyectoId: string, usuarioId: string): Promise<void> {
    return this.pedir("detener", proyectoId, usuarioId);
  }

  /** M3 lo llama al eliminar el proyecto, antes de borrar las filas. */
  async pedirEliminacion(proyecto: ProyectoAEliminar): Promise<void> {
    await this.cola.encolar({ tipo: "eliminar", proyectoId: proyecto.id, subdominio: proyecto.subdominio });
  }

  private async pedir(tipo: Exclude<TipoAccion, "eliminar">, proyectoId: string, usuarioId: string): Promise<void> {
    const proyecto = await this.proyectos.porId(proyectoId);
    if (!proyecto || proyecto.usuarioId !== usuarioId) throw new ProyectoNoEncontrado(proyectoId);
    const activo = await this.despliegues.activoDe(proyectoId);
    if (!activo) throw new SinDespliegueActivo(proyectoId);
    exigirAccionPermitida(tipo, activo.estado);
    await this.cola.encolar({ tipo, proyectoId, subdominio: proyecto.subdominio });
  }
}
