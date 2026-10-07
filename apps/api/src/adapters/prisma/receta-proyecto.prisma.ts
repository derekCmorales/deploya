import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../compartido/prisma/prisma.service";
import type { RecetaConstruccion } from "../../modules/construccion/dominio/estados";
import { RecetaProyectoPuerto } from "../../modules/construccion/puertos/receta-proyecto.puerto";

/** `Proyecto.receta` en PostgreSQL. Un proyecto borrado mientras se construía no falla. */
@Injectable()
export class RecetaProyectoPrisma extends RecetaProyectoPuerto {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async registrar(proyectoId: string, receta: RecetaConstruccion): Promise<void> {
    await this.prisma.proyecto.updateMany({ where: { id: proyectoId }, data: { receta } });
  }
}
