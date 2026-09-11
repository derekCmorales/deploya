import { Test } from "@nestjs/testing";
import { ObservabilidadController } from "./observabilidad.controller";

describe("ObservabilidadController", () => {
  it("health del módulo", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ObservabilidadController],
    }).compile();
    const controller = moduleRef.get(ObservabilidadController);
    expect(controller.health()).toEqual({ status: "ok", module: "observabilidad" });
  });
});
