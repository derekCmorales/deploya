import { Controller, Get } from "@nestjs/common";

@Controller("suscripciones")
export class SuscripcionesController {
  @Get("health")
  health() {
    return { status: "ok", module: "suscripciones" };
  }
}
