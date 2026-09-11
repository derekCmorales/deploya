import { Controller, Get } from "@nestjs/common";

@Controller("herramientas")
export class HerramientasController {
  @Get("health")
  health() {
    return { status: "ok", module: "herramientas" };
  }
}
