import { Injectable } from "@nestjs/common";
import type { Sesion as SesionFila } from "@prisma/client";
import { PrismaService } from "../../../compartido/prisma/prisma.service";
import type { NuevaSesion, Sesion } from "../dominio/sesion";
import { RepositorioSesiones } from "../puertos/repositorio-sesiones.puerto";

function sesionDesdePrisma(fila: SesionFila): Sesion {
  return {
    id: fila.id,
    usuarioId: fila.usuarioId,
    hashToken: fila.hashToken,
    creada: fila.creada,
    ultimaActividad: fila.ultimaActividad,
    revocadaEn: fila.revocadaEn,
  };
}

@Injectable()
export class RepositorioSesionesPrisma extends RepositorioSesiones {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async crear(sesion: NuevaSesion): Promise<Sesion> {
    return sesionDesdePrisma(await this.prisma.sesion.create({ data: sesion }));
  }

  async porHuella(hashToken: string): Promise<Sesion | null> {
    const fila = await this.prisma.sesion.findUnique({ where: { hashToken } });
    return fila ? sesionDesdePrisma(fila) : null;
  }

  async registrarActividad(id: string, marca: Date): Promise<void> {
    await this.prisma.sesion.update({ where: { id }, data: { ultimaActividad: marca } });
  }

  async revocar(id: string, marca: Date): Promise<void> {
    await this.prisma.sesion.updateMany({ where: { id, revocadaEn: null }, data: { revocadaEn: marca } });
  }

  async revocarTodasDe(usuarioId: string, marca: Date): Promise<void> {
    await this.prisma.sesion.updateMany({ where: { usuarioId, revocadaEn: null }, data: { revocadaEn: marca } });
  }
}
