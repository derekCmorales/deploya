import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../compartido/prisma/prisma.service";
import type { Invitacion, InvitacionActiva, NuevaInvitacion } from "../dominio/invitacion";
import { RepositorioInvitaciones } from "../puertos/repositorio-invitaciones.puerto";

@Injectable()
export class RepositorioInvitacionesPrisma extends RepositorioInvitaciones {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  crear(nueva: NuevaInvitacion): Promise<Invitacion> {
    return this.prisma.invitacion.create({ data: nueva });
  }

  activas(ahora: Date): Promise<InvitacionActiva[]> {
    return this.prisma.invitacion.findMany({
      where: { usada: null, revocada: null, vence: { gt: ahora } },
      orderBy: { vence: "asc" },
      select: { id: true, correo: true, vence: true },
    });
  }

  porId(id: string): Promise<Invitacion | null> {
    return this.prisma.invitacion.findUnique({ where: { id } });
  }

  porHash(hashToken: string): Promise<Invitacion | null> {
    return this.prisma.invitacion.findUnique({ where: { hashToken } });
  }

  async revocar(id: string, marca: Date): Promise<void> {
    await this.prisma.invitacion.update({ where: { id }, data: { revocada: marca } });
  }

  /** `updateMany` con `usada: null`: si otro registro la usó primero, no cuenta ninguna fila. */
  async marcarUsada(id: string, marca: Date): Promise<boolean> {
    const { count } = await this.prisma.invitacion.updateMany({ where: { id, usada: null }, data: { usada: marca } });
    return count === 1;
  }
}
