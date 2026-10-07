import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../compartido/prisma/prisma.service";
import type { Proyecto, ProyectoNuevo } from "../../modules/proyectos/dominio/proyecto";
import { RepositorioProyectos } from "../../modules/proyectos/puertos/repositorio-proyectos.puerto";
import { proyectoDesdePrisma } from "./traduccion-motor";

/**
 * Proyectos de M3 en PostgreSQL. También responde al `ProyectosLecturaPuerto` del motor
 * (un `Proyecto` cumple `ProyectoDesplegable`): el trabajador lee lo que guardó la API.
 */
@Injectable()
export class RepositorioProyectosPrisma extends RepositorioProyectos {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async guardar(nuevo: ProyectoNuevo): Promise<Proyecto> {
    return proyectoDesdePrisma(await this.prisma.proyecto.create({ data: nuevo }));
  }

  async porId(id: string): Promise<Proyecto | null> {
    const fila = await this.prisma.proyecto.findUnique({ where: { id } });
    return fila ? proyectoDesdePrisma(fila) : null;
  }

  async deUsuario(usuarioId: string): Promise<Proyecto[]> {
    const filas = await this.prisma.proyecto.findMany({ where: { usuarioId }, orderBy: { creado: "desc" } });
    return filas.map(proyectoDesdePrisma);
  }

  async existeSubdominio(subdominio: string): Promise<boolean> {
    return (await this.prisma.proyecto.count({ where: { subdominio } })) > 0;
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.proyecto.deleteMany({ where: { id } });
  }
}
