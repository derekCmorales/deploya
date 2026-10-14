import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Reloj } from "../../compartido/reloj";
import type { CambiosProyecto } from "../../modules/proyectos/dominio/cambios-proyecto";
import { ProyectoNoEncontrado } from "../../modules/proyectos/dominio/errores";
import type { Proyecto, ProyectoNuevo } from "../../modules/proyectos/dominio/proyecto";
import { RepositorioProyectos } from "../../modules/proyectos/puertos/repositorio-proyectos.puerto";

/**
 * Proyectos en memoria hasta DB-01. Responde también al `ProyectosLecturaPuerto` del
 * motor (un `Proyecto` cumple `ProyectoDesplegable`), así `crearDespliegue` lo encuentra.
 */
@Injectable()
export class RepositorioProyectosMemoria extends RepositorioProyectos {
  private readonly proyectos = new Map<string, Proyecto>();

  constructor(private readonly reloj: Reloj) {
    super();
  }

  async guardar(nuevo: ProyectoNuevo): Promise<Proyecto> {
    const proyecto: Proyecto = { ...nuevo, id: randomUUID(), creado: this.reloj.ahora() };
    this.proyectos.set(proyecto.id, proyecto);
    return proyecto;
  }

  async porId(id: string): Promise<Proyecto | null> {
    return this.proyectos.get(id) ?? null;
  }

  async deUsuario(usuarioId: string): Promise<Proyecto[]> {
    return [...this.proyectos.values()].filter((p) => p.usuarioId === usuarioId);
  }

  async existeSubdominio(subdominio: string): Promise<boolean> {
    return [...this.proyectos.values()].some((p) => p.subdominio === subdominio);
  }

  async actualizar(id: string, cambios: CambiosProyecto): Promise<Proyecto> {
    const proyecto = this.proyectos.get(id);
    if (!proyecto) throw new ProyectoNoEncontrado(id);
    const actualizado: Proyecto = { ...proyecto, ...cambios };
    this.proyectos.set(id, actualizado);
    return actualizado;
  }

  async eliminar(id: string): Promise<void> {
    this.proyectos.delete(id);
  }
}
