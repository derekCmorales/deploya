import type { Proyecto } from "../../proyectos/dominio/proyecto";

/** Lo que M7 lee de un proyecto de M3 para el resumen (13): el mismo almacén que `RepositorioProyectos`. */
export type DetalleProyecto = Pick<Proyecto, "id" | "usuarioId" | "nombre" | "subdominio" | "urlRepositorio" | "rama" | "puertoInterno">;

export abstract class DetalleProyectoPuerto {
  abstract porId(proyectoId: string): Promise<DetalleProyecto | null>;
}
