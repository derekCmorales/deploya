import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../compartido/prisma/prisma.service';
import { RepositorioVariables, VariablePersistida } from '../puertos/repositorio-variables.puerto';

@Injectable()
export class RepositorioVariablesPrisma extends RepositorioVariables {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async obtenerPorProyecto(proyectoId: string): Promise<VariablePersistida[]> {
    const registros = await this.prisma.variableProyecto.findMany({
      where: { proyectoId },
    });
    return registros.map((r) => ({
      id: r.id,
      proyectoId: r.proyectoId,
      clave: r.clave,
      valorCifrado: r.valorCifrado,
      creadoEn: r.creadoEn,
      actualizadoEn: r.actualizadoEn,
    }));
  }

  async guardarConjunto(proyectoId: string, variables: { clave: string; valorCifrado: string }[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.variableProyecto.deleteMany({ where: { proyectoId } });
      if (variables.length > 0) {
        await tx.variableProyecto.createMany({
          data: variables.map((v) => ({
            proyectoId,
            clave: v.clave,
            valorCifrado: v.valorCifrado,
          })),
        });
      }
    });
  }

  async eliminarPorProyecto(proyectoId: string): Promise<void> {
    await this.prisma.variableProyecto.deleteMany({ where: { proyectoId } });
  }
}