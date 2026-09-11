import { Controller, Get } from "@nestjs/common";

@Controller("construccion")
export class ConstruccionController {
  @Get("health")
  health() {
    return { status: "ok", module: "construccion" };
  }
}
