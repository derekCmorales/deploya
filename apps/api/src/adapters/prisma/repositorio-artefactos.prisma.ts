import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../compartido/prisma/prisma.service";
import type { Artefacto } from "../../modules/construccion/dominio/despliegue";
import {
  RepositorioArtefactos,
  type NuevoArtefacto,
} from "../../modules/construccion/puertos/repositorio-artefactos.puerto";
import { artefactoDesdePrisma } from "./traduccion-motor";

/** Artefactos `#n` con su digest (M4-01); la retención de M5-04 marcará `disponible = false`. */
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
}
