import { Controller, Get, UseFilters } from "@nestjs/common";
import type { PlanCatalogo } from "./dominio/plan";
import { ErroresSuscripcionesFilter } from "./errores-suscripciones.filter";
import { SuscripcionesService } from "./suscripciones.service";

@Controller("suscripciones")
@UseFilters(ErroresSuscripcionesFilter)
export class SuscripcionesController {
  constructor(private readonly suscripciones: SuscripcionesService) {}

  @Get("health")
  health() {
    return { status: "ok", module: "suscripciones" };
  }

  /** Público (pantalla 06): sin guard de sesión. En autoalojado, 404 `sin-cobro-en-autoalojado`. */
  @Get("planes")
  planes(): Promise<PlanCatalogo[]> {
    return this.suscripciones.catalogo();
  }
}
