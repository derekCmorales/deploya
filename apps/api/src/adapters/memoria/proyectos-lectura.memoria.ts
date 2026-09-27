import { Injectable } from "@nestjs/common";
import type { ProyectoDesplegable } from "../../modules/construccion/dominio/despliegue";
import { ProyectosLecturaPuerto } from "../../modules/construccion/puertos/proyectos-lectura.puerto";

@Injectable()
export class ProyectosLecturaMemoria extends ProyectosLecturaPuerto {
  private readonly proyectos = new Map<string, ProyectoDesplegable>();

  agregar(proyecto: ProyectoDesplegable): void {
    this.proyectos.set(proyecto.id, proyecto);
  }

  async porId(proyectoId: string): Promise<ProyectoDesplegable | null> {
    return this.proyectos.get(proyectoId) ?? null;
  }
}
