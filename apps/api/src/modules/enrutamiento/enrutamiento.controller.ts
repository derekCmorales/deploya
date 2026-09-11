import { Controller, Get } from "@nestjs/common";

@Controller("enrutamiento")
export class EnrutamientoController {
  @Get("health")
  health() {
    return { status: "ok", module: "enrutamiento" };
  }
}
