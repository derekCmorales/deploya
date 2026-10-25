import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../compartido/prisma/prisma.service";
import { RegistroAccionesPuerto, type AccionInstalacion } from "../puertos/registro-acciones.puerto";

/** Motivo fijo de las acciones sobre la instalación (`AccionAdministrativa.motivo` es obligatorio). */
export const MOTIVO_INSTALACION = "instalacion";

/** La instalación no es una cuenta: el afectado es el mismo administrador que hace el cambio. */
@Injectable()
export class RegistroAccionesPrisma extends RegistroAccionesPuerto {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async registrar({ adminId, accion, detalle, creado }: AccionInstalacion): Promise<void> {
    await this.prisma.accionAdministrativa.create({
      data: { adminId, usuarioAfectadoId: adminId, accion, motivo: MOTIVO_INSTALACION, detalle, creado },
    });
  }
}
