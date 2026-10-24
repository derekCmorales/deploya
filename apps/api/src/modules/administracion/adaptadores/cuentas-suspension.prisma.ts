import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../compartido/prisma/prisma.service";
import { estadoDesdePrisma } from "../../suscripciones/adaptadores/traduccion-prisma";
import { ACCION_REACTIVAR_CUENTA, MOTIVO_REACTIVACION, type Reactivacion } from "../dominio/reactivacion";
import { ACCION_SUSPENDER_CUENTA, type CuentaObjetivo, type Suspension } from "../dominio/suspension";
import { CuentasSuspensionPuerto } from "../puertos/cuentas-suspension.puerto";

/**
 * Unit of Work de M9-02 en PostgreSQL: estado y motivo de la cuenta, revocación de sus sesiones
 * abiertas (tabla de M1) y la `AccionAdministrativa`, todo o nada. SP-05 reactiva igual.
 */
@Injectable()
export class CuentasSuspensionPrisma extends CuentasSuspensionPuerto {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async cuenta(usuarioId: string): Promise<CuentaObjetivo | null> {
    const fila = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, rol: true, estadoCuenta: true, suscripcion: { select: { estado: true } } },
    });
    if (!fila) return null;
    const { suscripcion, ...cuenta } = fila;
    return { ...cuenta, suscripcion: suscripcion ? estadoDesdePrisma(suscripcion.estado) : null };
  }

  async suspender(s: Suspension): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.usuario.update({ where: { id: s.usuarioId }, data: { estadoCuenta: "suspendida", motivoSuspension: s.textoMotivo } }),
      this.prisma.sesion.updateMany({ where: { usuarioId: s.usuarioId, revocadaEn: null }, data: { revocadaEn: s.marca } }),
      this.prisma.accionAdministrativa.create({
        data: {
          adminId: s.adminId,
          usuarioAfectadoId: s.usuarioId,
          accion: ACCION_SUSPENDER_CUENTA,
          motivo: s.motivo,
          detalle: s.detalle,
          creado: s.marca,
        },
      }),
    ]);
  }

  async reactivar(r: Reactivacion): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.usuario.update({ where: { id: r.usuarioId }, data: { estadoCuenta: "activa", motivoSuspension: null } }),
      this.prisma.accionAdministrativa.create({
        data: {
          adminId: r.adminId,
          usuarioAfectadoId: r.usuarioId,
          accion: ACCION_REACTIVAR_CUENTA,
          motivo: MOTIVO_REACTIVACION,
          detalle: r.detalle,
          creado: r.marca,
        },
      }),
    ]);
  }
}
