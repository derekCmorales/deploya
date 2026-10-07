import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../compartido/prisma/prisma.service";
import type { CambioSuscripcion, NuevaSuscripcion, Suscripcion } from "../dominio/suscripcion";
import { RepositorioSuscripciones } from "../puertos/repositorio-suscripciones.puerto";
import { estadoAPrisma, INCLUIR_PLANES, suscripcionDesdePrisma } from "./traduccion-prisma";

@Injectable()
export class RepositorioSuscripcionesPrisma extends RepositorioSuscripciones {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async deUsuario(usuarioId: string): Promise<Suscripcion | null> {
    const fila = await this.prisma.suscripcion.findUnique({ where: { usuarioId }, include: INCLUIR_PLANES });
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

  async actualizar(suscripcionId: string, cambio: CambioSuscripcion): Promise<Suscripcion> {
    const fila = await this.prisma.suscripcion.update({
      where: { id: suscripcionId },
      data: { ...cambio, estado: estadoAPrisma(cambio.estado) },
      include: INCLUIR_PLANES,
    });
    return suscripcionDesdePrisma(fila);
  }

  async programarDescenso(suscripcionId: string, planSiguienteId: string): Promise<Suscripcion> {
    const fila = await this.prisma.suscripcion.update({
      where: { id: suscripcionId },
      data: { planSiguienteId },
      include: INCLUIR_PLANES,
    });
    return suscripcionDesdePrisma(fila);
  }
}
