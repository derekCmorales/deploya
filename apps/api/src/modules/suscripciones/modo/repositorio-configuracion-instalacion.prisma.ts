import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../compartido/prisma/prisma.service";
import { ID_INSTALACION } from "./configuracion-instalacion";
import { LIMITES_POR_DEFECTO, type CodigoConfiguracion, type LimitesInstalacion } from "./configuracion-instalacion";
import { RepositorioConfiguracionInstalacion } from "./repositorio-configuracion-instalacion.puerto";

@Injectable()
export class RepositorioConfiguracionInstalacionPrisma extends RepositorioConfiguracionInstalacion {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async limites(): Promise<LimitesInstalacion> {
    const fila = await this.prisma.configuracionInstalacion.findUnique({
      where: { id: ID_INSTALACION },
      select: { cpuPorProyecto: true, memoriaMbPorProyecto: true, proyectosPorUsuario: true },
    });
    if (!fila) return LIMITES_POR_DEFECTO;
    return { ...fila, cpuPorProyecto: fila.cpuPorProyecto.toNumber() };
  }

  async codigo(): Promise<CodigoConfiguracion | null> {
    const fila = await this.prisma.configuracionInstalacion.findUnique({ where: { id: ID_INSTALACION }, select: { hashCodigo: true, codigoVence: true } });
    if (!fila?.hashCodigo || !fila.codigoVence) return null;
    return { hashCodigo: fila.hashCodigo, codigoVence: fila.codigoVence };
  }

  async borrarCodigo(): Promise<void> {
    await this.prisma.configuracionInstalacion.updateMany({ where: { id: ID_INSTALACION }, data: { hashCodigo: null, codigoVence: null } });
  }

  /** Lectura de una sola columna de M1, igual que el seed: sin administrador no hay instalación configurada. */
  async hayAdministrador(): Promise<boolean> {
    return (await this.prisma.usuario.count({ where: { rol: "administrador" } })) > 0;
  }
}
