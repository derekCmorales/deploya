import { Injectable } from "@nestjs/common";
import { RepositorioProyectos } from "../puertos/repositorio-proyectos.puerto";
import { Proyecto } from "../dominio/proyecto";
import { Reloj } from "../../../compartido/reloj";

@Injectable()
export class RepositorioProyectosMemoria extends RepositorioProyectos {
  private readonly proyectos = new Map<string, Proyecto>();

  constructor(private readonly reloj: Reloj) {
    super();
  }

  async guardar(datos: Omit<Proyecto, "id" | "creado">): Promise<Proyecto> {
    const id = "proj-" + crypto.randomUUID();
    const creado = this.reloj.ahora();
    const proyecto: Proyecto = {
      ...datos,
      id,
      creado,
    };
    this.proyectos.set(id, proyecto);
    return proyecto;
  }

  async porId(id: string): Promise<Proyecto | null> {
    return this.proyectos.get(id) ?? null;
  }

  async deUsuario(usuarioId: string): Promise<Proyecto[]> {
    const resultado: Proyecto[] = [];
    for (const p of this.proyectos.values()) {
      if (p.usuarioId === usuarioId) {
        resultado.push(p);
      }
    }
    return resultado;
  }

  async existeSubdominio(subdominio: string): Promise<boolean> {
    for (const p of this.proyectos.values()) {
      if (p.subdominio === subdominio) {
        return true;
      }
    }
    return false;
  }
}