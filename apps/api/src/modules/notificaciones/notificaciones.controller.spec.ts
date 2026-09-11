import { Test } from "@nestjs/testing";
import { NotificacionesController } from "./notificaciones.controller";

describe("NotificacionesController", () => {
  it("health del módulo", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [NotificacionesController],
    }).compile();
    const controller = moduleRef.get(NotificacionesController);
    expect(controller.health()).toEqual({ status: "ok", module: "notificaciones" });
  });
});
