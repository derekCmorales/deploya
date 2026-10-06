import { Injectable } from "@nestjs/common";
import { CuotaPlanPuerto, type PermisoPlan, type RecursosPlan } from "../../modules/orquestacion/puertos/cuota-plan.puerto";

/**
 * Hasta que M2 exporte `cuotaDe` (DB-01), todos quedan en los recursos de Sandbox
 * del seed firmado (docs/contratos/datos-nucleo.md).
 */
export const CONSTRUCCIONES_SANDBOX = 30;
export const RECURSOS_SANDBOX: RecursosPlan = { plan: "sandbox", cpus: 0.25, memoriaMb: 256 };

@Injectable()
export class CuotaPlanStub extends CuotaPlanPuerto {
  recursos: RecursosPlan = RECURSOS_SANDBOX;
  permiso: PermisoPlan = { estado: "activa", construccionesMes: CONSTRUCCIONES_SANDBOX };
  readonly consultados: string[] = [];

  async recursosDe(usuarioId: string): Promise<RecursosPlan> {
    this.consultados.push(usuarioId);
    return this.recursos;
  }

  async permisoDe(): Promise<PermisoPlan> {
    return this.permiso;
  }
}
