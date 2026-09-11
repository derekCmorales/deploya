import { Test } from "@nestjs/testing";
import { ProyectosController } from "./proyectos.controller";

describe("ProyectosController", () => {
  it("health del módulo", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProyectosController],
    }).compile();
    const controller = moduleRef.get(ProyectosController);
    expect(controller.health()).toEqual({ status: "ok", module: "proyectos" });
  });
});
