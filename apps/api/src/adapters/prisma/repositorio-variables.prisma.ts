import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../compartido/prisma/prisma.service";
import {
  RepositorioVariables,
  type VariableGuardada,
  type VariableNueva,
} from "../../modules/proyectos/puertos/repositorio-variables.puerto";

/** `VariableEntorno` en PostgreSQL. El valor solo se escribe cifrado. */
@Injectable()
export class RepositorioVariablesPrisma extends RepositorioVariables {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async deProyecto(proyectoId: string): Promise<VariableGuardada[]> {
    const filas = await this.prisma.variableEntorno.findMany({ where: { proyectoId }, orderBy: { clave: "asc" } });
    return filas.map(aGuardada);
  }

  async reemplazar(proyectoId: string, variables: VariableNueva[]): Promise<VariableGuardada[]> {
    await this.prisma.$transaction(async (tx) => {
      await this.borrarAusentes(tx, proyectoId, variables.map((variable) => variable.clave));
      for (const variable of variables) await this.escribir(tx, proyectoId, variable);
    });
    return this.deProyecto(proyectoId);
  }

  /** `notIn: []` no borra en Prisma; el conjunto vacío sí debe vaciar el proyecto. */
  private borrarAusentes(tx: ParametrosTransaccion, proyectoId: string, claves: string[]) {
    const where = claves.length === 0 ? { proyectoId } : { proyectoId, clave: { notIn: claves } };
    return tx.variableEntorno.deleteMany({ where });
  }

  /** Mismo cifrado: no tocar la fila. `@updatedAt` cambiaría «Actualizada» sin un cambio real. */
  private async escribir(tx: ParametrosTransaccion, proyectoId: string, variable: VariableNueva) {
    const previa = await tx.variableEntorno.findUnique({
      where: { proyectoId_clave: { proyectoId, clave: variable.clave } },
    });
    if (previa?.valorCifrado === variable.valorCifrado) return;
    await tx.variableEntorno.upsert({
      where: { proyectoId_clave: { proyectoId, clave: variable.clave } },
      create: { proyectoId, clave: variable.clave, valorCifrado: variable.valorCifrado },
      update: { valorCifrado: variable.valorCifrado },
    });
  }
}

type ParametrosTransaccion = Parameters<Parameters<PrismaService["$transaction"]>[0]>[0];

function aGuardada(fila: { clave: string; valorCifrado: string; actualizado: Date }): VariableGuardada {
  return { clave: fila.clave, valorCifrado: fila.valorCifrado, actualizado: fila.actualizado };
}
