import { Test } from "@nestjs/testing";
import { SuscripcionesController } from "./suscripciones.controller";

describe("SuscripcionesController", () => {
  it("health del módulo", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SuscripcionesController],
    }).compile();
    const controller = moduleRef.get(SuscripcionesController);
    expect(controller.health()).toEqual({ status: "ok", module: "suscripciones" });
  });
});
