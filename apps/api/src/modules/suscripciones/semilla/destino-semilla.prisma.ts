import type { PrismaClient } from "@prisma/client";
import { DestinoSemilla, type UsuarioParaGuardar } from "./destino-semilla.puerto";
import type { PlanSemilla } from "./semilla";

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
}
