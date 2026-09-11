import { Test } from "@nestjs/testing";
import { AdministracionController } from "./administracion.controller";

describe("AdministracionController", () => {
  it("health del módulo", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdministracionController],
    }).compile();
    const controller = moduleRef.get(AdministracionController);
    expect(controller.health()).toEqual({ status: "ok", module: "administracion" });
  });
});
