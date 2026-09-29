import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../compartido/prisma/prisma.service";
import type { NuevaSuscripcion, Suscripcion } from "../dominio/suscripcion";
import { RepositorioSuscripciones } from "../puertos/repositorio-suscripciones.puerto";
import { estadoAPrisma, suscripcionDesdePrisma } from "./traduccion-prisma";

@Injectable()
export class RepositorioSuscripcionesPrisma extends RepositorioSuscripciones {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async deUsuario(usuarioId: string): Promise<Suscripcion | null> {
    const fila = await this.prisma.suscripcion.findUnique({ where: { usuarioId }, include: { plan: true } });
    return fila ? suscripcionDesdePrisma(fila) : null;
  }

  async crearSiNoExiste(nueva: NuevaSuscripcion): Promise<void> {
    await this.prisma.suscripcion.upsert({
      where: { usuarioId: nueva.usuarioId },
      update: {},
      create: {
        usuarioId: nueva.usuarioId,
        planId: nueva.planId,
        estado: estadoAPrisma(nueva.estado),
        estadoDesde: nueva.inicio,
        vigenciaDias: nueva.vigenciaDias,
        inicio: nueva.inicio,
        vence: nueva.vence,
      },
    });
  }
}
