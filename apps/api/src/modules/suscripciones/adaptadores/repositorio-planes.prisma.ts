import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../compartido/prisma/prisma.service";
import type { Plan } from "../dominio/plan";
import { RepositorioPlanes } from "../puertos/repositorio-planes.puerto";
import { planDesdePrisma } from "./traduccion-prisma";

@Injectable()
export class RepositorioPlanesPrisma extends RepositorioPlanes {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async todos(): Promise<Plan[]> {
    const filas = await this.prisma.plan.findMany();
    return filas.map(planDesdePrisma);
  }

  async porCodigo(codigo: string): Promise<Plan | null> {
    const fila = await this.prisma.plan.findUnique({ where: { codigo } });
    return fila ? planDesdePrisma(fila) : null;
  }
}
