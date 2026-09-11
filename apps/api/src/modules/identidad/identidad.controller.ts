import { Controller, Get } from "@nestjs/common";

@Controller("identidad")
export class IdentidadController {
  @Get("health")
  health() {
    return { status: "ok", module: "identidad" };
  }
}
