import type { PrismaClient } from "@prisma/client";
import { DestinoSemilla, type UsuarioParaGuardar } from "./destino-semilla.puerto";
import type { CodigoSemilla, PlanSemilla } from "./semilla";

const ID_INSTALACION = "instalacion";

export class DestinoSemillaPrisma extends DestinoSemilla {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async guardarPlan(plan: PlanSemilla): Promise<void> {
    await this.prisma.plan.upsert({ where: { codigo: plan.codigo }, update: plan, create: plan });
  }

  async guardarUsuario(usuario: UsuarioParaGuardar): Promise<string> {
    const { id } = await this.prisma.usuario.upsert({
      where: { correo: usuario.correo },
      update: { nombre: usuario.nombre, rol: usuario.rol, estadoCuenta: "activa" },
      create: { ...usuario, estadoCuenta: "activa" },
    });
    return id;
  }

  async guardarCodigo(codigo: CodigoSemilla): Promise<boolean> {
    const admin = await this.prisma.usuario.findFirst({ where: { rol: "administrador" }, select: { id: true } });
    if (admin) return false;
    await this.prisma.configuracionInstalacion.upsert({
      where: { id: ID_INSTALACION },
      create: { id: ID_INSTALACION, hashCodigo: codigo.hashCodigo, codigoVence: codigo.codigoVence },
      update: { hashCodigo: codigo.hashCodigo, codigoVence: codigo.codigoVence },
    });
    return true;
  }
}
