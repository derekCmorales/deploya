/// <reference types="jest" />
import { Test, TestingModule } from "@nestjs/testing";
import { ProyectosController } from "./proyectos.controller";
import { ProyectosService } from "./proyectos.service";
import { ProveedorFuente } from "./puertos/proveedor-fuente.puerto";
import { RepositorioProyectos } from "./puertos/repositorio-proyectos.puerto";
import { CuotaProyectosPuerto } from "./puertos/cuota-proyectos.puerto";
import { ConstruccionService } from "../construccion/construccion.service";

describe("ProyectosController", () => {
  let controller: ProyectosController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ProyectosController],
      providers: [
        ProyectosService,
        { provide: ProveedorFuente, useValue: {} },
        { provide: RepositorioProyectos, useValue: {} },
        { provide: CuotaProyectosPuerto, useValue: {} },
        { provide: ConstruccionService, useValue: {} },
      ],
    }).compile();

    controller = moduleRef.get<ProyectosController>(ProyectosController);
  });

  it("health del módulo", () => {
    expect(controller.health()).toEqual({ status: "ok", module: "proyectos" });
  });
});