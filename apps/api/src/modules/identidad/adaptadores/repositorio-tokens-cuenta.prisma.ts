import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../compartido/prisma/prisma.service";
import type { NuevoTokenCuenta, TipoTokenCuenta, TokenCuenta } from "../dominio/cuenta";
import { RepositorioTokensCuenta } from "../puertos/repositorio-tokens-cuenta.puerto";

/** `TokenCuenta` en PostgreSQL: solo la huella sha256, nunca el token del enlace. */
@Injectable()
export class RepositorioTokensCuentaPrisma extends RepositorioTokensCuenta {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async crear(token: NuevoTokenCuenta): Promise<TokenCuenta> {
    return this.prisma.tokenCuenta.create({ data: token });
  }

  async porHuella(hashToken: string): Promise<TokenCuenta | null> {
    return this.prisma.tokenCuenta.findUnique({ where: { hashToken } });
  }

  /** Condicional (`usadoEn IS NULL`): dos clics simultáneos no reescriben la marca de uso. */
  async marcarUsado(id: string, usadoEn: Date): Promise<void> {
    await this.prisma.tokenCuenta.updateMany({ where: { id, usadoEn: null }, data: { usadoEn } });
  }

  async invalidarVigentes(usuarioId: string, tipo: TipoTokenCuenta, marca: Date): Promise<void> {
    await this.prisma.tokenCuenta.updateMany({ where: { usuarioId, tipo, usadoEn: null }, data: { usadoEn: marca } });
  }

  async ultimoDe(usuarioId: string, tipo: TipoTokenCuenta): Promise<TokenCuenta | null> {
    return this.prisma.tokenCuenta.findFirst({ where: { usuarioId, tipo }, orderBy: { creado: "desc" } });
  }
}
