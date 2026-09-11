import { Controller, Get } from "@nestjs/common";

@Controller("observabilidad")
export class ObservabilidadController {
  @Get("health")
  health() {
    return { status: "ok", module: "observabilidad" };
  }
}
