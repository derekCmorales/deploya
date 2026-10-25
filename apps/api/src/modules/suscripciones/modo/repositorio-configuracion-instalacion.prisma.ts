import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../compartido/prisma/prisma.service";
import {
  ID_INSTALACION,
  LIMITES_POR_DEFECTO,
  POLITICA_POR_DEFECTO,
  type CodigoConfiguracion,
  type CorreoGuardable,
  type CorreoInstalacion,
  type LimitesInstalacion,
  type PoliticaRegistro,
} from "./configuracion-instalacion";
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

  async politicaRegistro(): Promise<PoliticaRegistro> {
    const fila = await this.prisma.configuracionInstalacion.findUnique({ where: { id: ID_INSTALACION }, select: { politicaRegistro: true } });
    return fila?.politicaRegistro ?? POLITICA_POR_DEFECTO;
  }

  async guardarPoliticaRegistro(politica: PoliticaRegistro): Promise<void> {
    await this.guardar({ politicaRegistro: politica });
  }

  async guardarLimites({ cpuPorProyecto, memoriaMbPorProyecto, proyectosPorUsuario }: LimitesInstalacion): Promise<void> {
    await this.guardar({ cpuPorProyecto, memoriaMbPorProyecto, proyectosPorUsuario });
  }

  async correo(): Promise<CorreoInstalacion> {
    const fila = await this.prisma.configuracionInstalacion.findUnique({
      where: { id: ID_INSTALACION },
      select: { smtpHost: true, smtpPuerto: true, smtpUsuario: true, smtpClaveCifrada: true, smtpRemitente: true, sinCorreo: true },
    });
    if (fila?.sinCorreo) return { tipo: "sin-correo" };
    if (!fila?.smtpHost || fila.smtpPuerto === null || fila.smtpClaveCifrada === null || !fila.smtpRemitente) return { tipo: "entorno" };
    return {
      tipo: "smtp",
      smtp: { host: fila.smtpHost, puerto: fila.smtpPuerto, usuario: fila.smtpUsuario ?? "", claveCifrada: fila.smtpClaveCifrada, remitente: fila.smtpRemitente },
    };
  }

  async guardarCorreo(correo: CorreoGuardable): Promise<void> {
    await this.guardar(columnasCorreo(correo));
  }

  private async guardar(datos: Prisma.ConfiguracionInstalacionUpdateInput & Prisma.ConfiguracionInstalacionCreateInput): Promise<void> {
    await this.prisma.configuracionInstalacion.upsert({ where: { id: ID_INSTALACION }, create: { ...datos, id: ID_INSTALACION }, update: datos });
  }
}

/** Las seis columnas siempre juntas: un SMTP nuevo apaga «sin correo» y «sin correo» borra el SMTP. */
function columnasCorreo(correo: CorreoGuardable): Prisma.ConfiguracionInstalacionUpdateInput & Prisma.ConfiguracionInstalacionCreateInput {
  if (correo.tipo === "sin-correo") {
    return { smtpHost: null, smtpPuerto: null, smtpUsuario: null, smtpClaveCifrada: null, smtpRemitente: null, sinCorreo: true };
  }
  const { host, puerto, usuario, claveCifrada, remitente } = correo.smtp;
  return { smtpHost: host, smtpPuerto: puerto, smtpUsuario: usuario, smtpClaveCifrada: claveCifrada, smtpRemitente: remitente, sinCorreo: false };
}
