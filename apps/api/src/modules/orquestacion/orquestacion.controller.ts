import { Controller, Get } from "@nestjs/common";

@Controller("orquestacion")
export class OrquestacionController {
  @Get("health")
  health() {
    return { status: "ok", module: "orquestacion" };
  }
}
