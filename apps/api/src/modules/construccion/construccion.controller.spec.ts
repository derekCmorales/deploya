import { Test } from "@nestjs/testing";
import { ConstruccionController } from "./construccion.controller";

describe("ConstruccionController", () => {
  it("health del módulo", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ConstruccionController],
    }).compile();
    const controller = moduleRef.get(ConstruccionController);
    expect(controller.health()).toEqual({ status: "ok", module: "construccion" });
  });
});
