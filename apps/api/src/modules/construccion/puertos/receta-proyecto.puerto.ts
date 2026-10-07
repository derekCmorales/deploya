import type { RecetaConstruccion } from "../dominio/estados";

/** Guarda en el proyecto la última receta que detectó M4 (`Proyecto.receta`). */
export abstract class RecetaProyectoPuerto {
  abstract registrar(proyectoId: string, receta: RecetaConstruccion): Promise<void>;
}
