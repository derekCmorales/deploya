import { Controller, Get } from "@nestjs/common";
import type { PlanCatalogo } from "./dominio/plan";
import { SuscripcionesService } from "./suscripciones.service";

@Controller("suscripciones")
export class SuscripcionesController {
  constructor(private readonly suscripciones: SuscripcionesService) {}

  @Get("health")
  health() {
    return { status: "ok", module: "suscripciones" };
  }

  /** Público (pantalla 06): sin guard de sesión. */
  @Get("planes")
  planes(): Promise<PlanCatalogo[]> {
    return this.suscripciones.catalogo();
  }
}
