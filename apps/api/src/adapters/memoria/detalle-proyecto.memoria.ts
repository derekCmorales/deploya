import { Injectable } from "@nestjs/common";
import { DetalleProyectoPuerto, type DetalleProyecto } from "../../modules/observabilidad/puertos/detalle-proyecto.puerto";

/** Detalle de proyectos en memoria (mismo contrato que `RepositorioProyectos.porId`). */
@Injectable()
export class DetalleProyectoMemoria extends DetalleProyectoPuerto {
  private readonly proyectos = new Map<string, DetalleProyecto>();

  agregar(proyecto: DetalleProyecto): void {
    this.proyectos.set(proyecto.id, proyecto);
  }

  async porId(proyectoId: string): Promise<DetalleProyecto | null> {
    return this.proyectos.get(proyectoId) ?? null;
  }
}
