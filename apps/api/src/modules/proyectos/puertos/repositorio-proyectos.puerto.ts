import type { Proyecto, ProyectoNuevo } from "../dominio/proyecto";

/**
 * Persistencia de proyectos (Repository). El mismo almacén responde al
 * `ProyectosLecturaPuerto` del motor, así M4 encuentra lo que M3 guarda.
 */
export abstract class RepositorioProyectos {
  /** Asigna `id` y `creado`. */
  abstract guardar(proyecto: ProyectoNuevo): Promise<Proyecto>;
  abstract porId(id: string): Promise<Proyecto | null>;
  abstract deUsuario(usuarioId: string): Promise<Proyecto[]>;
  abstract existeSubdominio(subdominio: string): Promise<boolean>;
}
