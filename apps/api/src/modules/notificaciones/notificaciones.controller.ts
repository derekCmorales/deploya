import { Controller, Get } from "@nestjs/common";

@Controller("notificaciones")
export class NotificacionesController {
  @Get("health")
  health() {
    return { status: "ok", module: "notificaciones" };
  }
}
