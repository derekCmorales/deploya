import { Test } from "@nestjs/testing";
import { IdentidadController } from "./identidad.controller";

describe("IdentidadController", () => {
  it("health del módulo", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [IdentidadController],
    }).compile();
    const controller = moduleRef.get(IdentidadController);
    expect(controller.health()).toEqual({ status: "ok", module: "identidad" });
  });
});
