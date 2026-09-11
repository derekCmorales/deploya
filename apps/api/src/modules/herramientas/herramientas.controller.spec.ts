import { Test } from "@nestjs/testing";
import { HerramientasController } from "./herramientas.controller";

describe("HerramientasController", () => {
  it("health del módulo", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HerramientasController],
    }).compile();
    const controller = moduleRef.get(HerramientasController);
    expect(controller.health()).toEqual({ status: "ok", module: "herramientas" });
  });
});
