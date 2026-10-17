import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../compartido/prisma/prisma.service";
import type { Artefacto } from "../../modules/construccion/dominio/despliegue";
import {
  RepositorioArtefactos,
  type NuevoArtefacto,
} from "../../modules/construccion/puertos/repositorio-artefactos.puerto";
import { artefactoDesdePrisma } from "./traduccion-motor";

/** Artefactos `#n` con su digest (M4-01); la retención de M5-04 marca `disponible = false`. */
@Injectable()
export class RepositorioArtefactosPrisma extends RepositorioArtefactos {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async registrar(nuevo: NuevoArtefacto): Promise<Artefacto> {
    const fila = await this.prisma.artefacto.create({ data: { ...nuevo, tamanoBytes: BigInt(nuevo.tamanoBytes) } });
    return artefactoDesdePrisma(fila);
  }

  async porId(id: string): Promise<Artefacto | null> {
    const fila = await this.prisma.artefacto.findUnique({ where: { id } });
    return fila ? artefactoDesdePrisma(fila) : null;
  }

  async deProyecto(proyectoId: string): Promise<Artefacto[]> {
    const filas = await this.prisma.artefacto.findMany({ where: { proyectoId }, orderBy: { numero: "desc" } });
    return filas.map(artefactoDesdePrisma);
  }

  async disponiblesDe(proyectoId: string): Promise<Artefacto[]> {
    const filas = await this.prisma.artefacto.findMany({ where: { proyectoId, disponible: true }, orderBy: { numero: "desc" } });
    return filas.map(artefactoDesdePrisma);
  }

  async marcarNoDisponible(id: string): Promise<void> {
    await this.prisma.artefacto.updateMany({ where: { id }, data: { disponible: false } });
  }
}
