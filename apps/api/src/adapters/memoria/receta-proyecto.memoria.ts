import { Injectable } from "@nestjs/common";
import type { RecetaConstruccion } from "../../modules/construccion/dominio/estados";
import { RecetaProyectoPuerto } from "../../modules/construccion/puertos/receta-proyecto.puerto";

@Injectable()
export class RecetaProyectoMemoria extends RecetaProyectoPuerto {
  readonly recetas = new Map<string, RecetaConstruccion>();

  async registrar(proyectoId: string, receta: RecetaConstruccion): Promise<void> {
    this.recetas.set(proyectoId, receta);
  }
}
