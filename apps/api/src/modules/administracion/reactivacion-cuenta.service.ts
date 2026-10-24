import { Injectable, Logger } from "@nestjs/common";
import { Reloj } from "../../compartido/reloj";
import { ContenedoresClientePuerto } from "../orquestacion/puertos/contenedores-cliente.puerto";
import { UsuarioNoEncontrado } from "./dominio/errores";
import { exigirReactivable, reanudaContenedores, type SolicitudReactivacion } from "./dominio/reactivacion";
import { CuentasSuspensionPuerto } from "./puertos/cuentas-suspension.puerto";

/** Qué pasó con los contenedores: 25c lo dice en el diálogo. */
export interface ResultadoReactivacion {
  contenedores: "reanudados" | "esperan-renovacion";
}

/**
 * SP-05 (Service Layer + Unit of Work), simétrico a `SuspensionService`: valida, reactiva la
 * cuenta en una transacción (estado, motivo borrado y `AccionAdministrativa`) y **después**, solo
 * si la suscripción está vigente, pide a M5 reanudar sus contenedores. Si M5 falla, la cuenta
 * queda reactivada y el error se registra.
 */
@Injectable()
export class ReactivacionCuentaService {
  private readonly registro = new Logger(ReactivacionCuentaService.name);

  constructor(
    private readonly cuentas: CuentasSuspensionPuerto,
    private readonly contenedores: ContenedoresClientePuerto,
    private readonly reloj: Reloj,
  ) {}

  async reactivar(adminId: string, usuarioId: string, { detalle }: SolicitudReactivacion): Promise<ResultadoReactivacion> {
    const cuenta = await this.cuentas.cuenta(usuarioId);
    if (!cuenta) throw new UsuarioNoEncontrado(usuarioId);
    exigirReactivable(cuenta);
    await this.cuentas.reactivar({ adminId, usuarioId, detalle, marca: this.reloj.ahora() });
    if (!reanudaContenedores(cuenta.suscripcion)) return { contenedores: "esperan-renovacion" };
    await this.reanudarContenedores(usuarioId);
    return { contenedores: "reanudados" };
  }

  private async reanudarContenedores(usuarioId: string): Promise<void> {
    try {
      await this.contenedores.reanudarTodos(usuarioId);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.registro.error(`Cuenta ${usuarioId} reactivada, pero no se pudieron reanudar sus contenedores: ${mensaje}`);
    }
  }
}
