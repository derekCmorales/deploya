import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../compartido/prisma/prisma.service";
import { PurgaDatosVencidosPuerto } from "../../modules/administracion/limpieza/puertos/purga-datos-vencidos.puerto";

/**
 * Adapter de la limpieza diaria (EST-01b): un `deleteMany` por fecha en cada tabla. No conoce los
 * plazos (los decide `cortesDeLimpieza`) ni toca otra tabla. `TokenCuenta` y `Sesion` son de M1.
 */
@Injectable()
export class PurgaDatosVencidosPrisma extends PurgaDatosVencidosPuerto {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async purgarTokensCuenta(antesDe: Date): Promise<number> {
    const { count } = await this.prisma.tokenCuenta.deleteMany({ where: { OR: [{ usadoEn: { lt: antesDe } }, { expira: { lt: antesDe } }] } });
    return count;
  }

  async purgarSesiones(revocadasAntesDe: Date, inactivasAntesDe: Date): Promise<number> {
    const { count } = await this.prisma.sesion.deleteMany({
      where: { OR: [{ revocadaEn: { lt: revocadasAntesDe } }, { ultimaActividad: { lt: inactivasAntesDe } }] },
    });
    return count;
  }

  async purgarInvitaciones(antesDe: Date): Promise<number> {
    const { count } = await this.prisma.invitacion.deleteMany({
      where: { OR: [{ usada: { lt: antesDe } }, { revocada: { lt: antesDe } }, { vence: { lt: antesDe } }] },
    });
    return count;
  }
}
