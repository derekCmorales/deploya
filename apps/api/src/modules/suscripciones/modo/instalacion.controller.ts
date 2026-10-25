import { Controller, Get, Inject } from "@nestjs/common";
import { AltaPrimerUsuario } from "./alta-primer-usuario.puerto";
import { MODO_INSTALACION, type ModoInstalacion } from "./modo-instalacion";

export interface EstadoModo {
  modo: ModoInstalacion;
  configurada: boolean;
}

/** `GET /instalacion/modo` (público, contrato instalacion.md): la web oculta Suscripción y Planes. */
@Controller("instalacion")
export class InstalacionController {
  constructor(
    @Inject(MODO_INSTALACION) private readonly modo: ModoInstalacion,
    private readonly alta: AltaPrimerUsuario,
  ) {}

  @Get("modo")
  async estado(): Promise<EstadoModo> {
    return { modo: this.modo, configurada: await this.alta.configurada() };
  }
}
