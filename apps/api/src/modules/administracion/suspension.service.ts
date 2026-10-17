import { Injectable, Logger } from "@nestjs/common";
import { Reloj } from "../../compartido/reloj";
import { ContenedoresClientePuerto } from "../orquestacion/puertos/contenedores-cliente.puerto";
import { UsuarioNoEncontrado } from "./dominio/errores";
import { exigirSuspendible, MOTIVOS_SUSPENSION, type SolicitudSuspension } from "./dominio/suspension";
import { CuentasSuspensionPuerto } from "./puertos/cuentas-suspension.puerto";

/**
 * M9-02 (Service Layer + Unit of Work): valida, suspende la cuenta en una transacción (estado,
 * motivo, sesiones revocadas y `AccionAdministrativa`) y **después** pide a M5 detener sus
 * contenedores. Si M5 falla, la suspensión queda hecha y el error se registra.
 */
@Injectable()
export class SuspensionService {
  private readonly registro = new Logger(SuspensionService.name);

  constructor(
    private readonly cuentas: CuentasSuspensionPuerto,
    private readonly contenedores: ContenedoresClientePuerto,
    private readonly reloj: Reloj,
  ) {}

  async suspender(adminId: string, usuarioId: string, { motivo, detalle }: SolicitudSuspension): Promise<void> {
    const cuenta = await this.cuentas.cuenta(usuarioId);
    if (!cuenta) throw new UsuarioNoEncontrado(usuarioId);
    exigirSuspendible(cuenta);
    await this.cuentas.suspender({
      adminId,
      usuarioId,
      motivo,
      textoMotivo: MOTIVOS_SUSPENSION[motivo],
      detalle,
      marca: this.reloj.ahora(),
    });
    await this.detenerContenedores(usuarioId);
  }

  private async detenerContenedores(usuarioId: string): Promise<void> {
    try {
      await this.contenedores.detenerTodos(usuarioId);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.registro.error(`Cuenta ${usuarioId} suspendida, pero no se pudieron detener sus contenedores: ${mensaje}`);
    }
  }
}
