import { Proyecto } from "../dominio/proyecto";

export abstract class RepositorioProyectos {
  abstract guardar(proyecto: Omit<Proyecto, "id" | "creado">): Promise<Proyecto>;
  abstract porId(id: string): Promise<Proyecto | null>;
  abstract deUsuario(usuarioId: string): Promise<Proyecto[]>;
  abstract existeSubdominio(subdominio: string): Promise<boolean>;
}