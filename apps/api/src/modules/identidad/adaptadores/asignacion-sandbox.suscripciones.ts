import { Injectable } from "@nestjs/common";
import { SuscripcionesService } from "../../suscripciones/suscripciones.service";
import { AsignacionSandboxPuerto } from "../puertos/asignacion-sandbox.puerto";

/** Adapter sobre `SuscripcionesService.asignarSandbox` (DB-01): toda cuenta nueva arranca en Sandbox. */
@Injectable()
export class AsignacionSandboxSuscripciones extends AsignacionSandboxPuerto {
  constructor(private readonly suscripciones: SuscripcionesService) {
    super();
  }

  asignarSandbox(usuarioId: string): Promise<void> {
    return this.suscripciones.asignarSandbox(usuarioId);
  }
}
