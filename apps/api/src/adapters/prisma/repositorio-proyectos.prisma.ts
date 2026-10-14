import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../compartido/prisma/prisma.service";
import { Prisma } from "@prisma/client";
import type { CambiosProyecto } from "../../modules/proyectos/dominio/cambios-proyecto";
import { NombreRepetido, ProyectoNoEncontrado } from "../../modules/proyectos/dominio/errores";
import type { Proyecto, ProyectoNuevo } from "../../modules/proyectos/dominio/proyecto";
import { RepositorioProyectos } from "../../modules/proyectos/puertos/repositorio-proyectos.puerto";
import { proyectoDesdePrisma } from "./traduccion-motor";

const VIOLACION_UNICA = "P2002";
const REGISTRO_INEXISTENTE = "P2025";

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

  async actualizar(id: string, cambios: CambiosProyecto): Promise<Proyecto> {
    try {
      return proyectoDesdePrisma(await this.prisma.proyecto.update({ where: { id }, data: cambios }));
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (error.code === VIOLACION_UNICA) throw new NombreRepetido(cambios.nombre ?? "");
      if (error.code === REGISTRO_INEXISTENTE) throw new ProyectoNoEncontrado(id);
      throw error;
    }
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.proyecto.deleteMany({ where: { id } });
  }
}
