import { Test } from "@nestjs/testing";
import { EnrutamientoController } from "./enrutamiento.controller";

describe("EnrutamientoController", () => {
  it("health del módulo", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EnrutamientoController],
    }).compile();
    const controller = moduleRef.get(EnrutamientoController);
    expect(controller.health()).toEqual({ status: "ok", module: "enrutamiento" });
  });
});
