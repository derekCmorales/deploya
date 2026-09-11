import { Test } from "@nestjs/testing";
import { OrquestacionController } from "./orquestacion.controller";

describe("OrquestacionController", () => {
  it("health del módulo", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [OrquestacionController],
    }).compile();
    const controller = moduleRef.get(OrquestacionController);
    expect(controller.health()).toEqual({ status: "ok", module: "orquestacion" });
  });
});
