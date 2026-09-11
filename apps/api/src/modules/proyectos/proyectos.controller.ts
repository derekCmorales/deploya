import { Controller, Get } from "@nestjs/common";

@Controller("proyectos")
export class ProyectosController {
  @Get("health")
  health() {
    return { status: "ok", module: "proyectos" };
  }
}
