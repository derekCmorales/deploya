import { Logger } from "@nestjs/common";
import { AsignacionSandboxPuerto } from "../puertos/asignacion-sandbox.puerto";

/** Hasta que M2 exporte `SuscripcionesService.asignarSandbox` (DB-01): solo deja constancia. */
export class AsignacionSandboxStub extends AsignacionSandboxPuerto {
  private readonly registro = new Logger("AsignacionSandbox");

  async asignarSandbox(usuarioId: string): Promise<void> {
    this.registro.log(`Sandbox pendiente de M2 para ${usuarioId}`);
  }
}
