import { Controller, Get } from "@nestjs/common";

@Controller("administracion")
export class AdministracionController {
  @Get("health")
  health() {
    return { status: "ok", module: "administracion" };
  }
}
