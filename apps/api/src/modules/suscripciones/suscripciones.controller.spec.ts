import { Test } from "@nestjs/testing";
import { Reloj, RelojFijo } from "../../compartido/reloj";
import { planesDePrueba } from "./adaptadores/planes.fixture";
import { RepositorioPlanesMemoria } from "./adaptadores/repositorio-planes.memoria";
import { RepositorioSuscripcionesMemoria } from "./adaptadores/repositorio-suscripciones.memoria";
import { RepositorioPlanes } from "./puertos/repositorio-planes.puerto";
import { RepositorioSuscripciones } from "./puertos/repositorio-suscripciones.puerto";
import { SuscripcionesController } from "./suscripciones.controller";
import { SuscripcionesService } from "./suscripciones.service";

async function controlador(): Promise<SuscripcionesController> {
  const planes = planesDePrueba();
  const moduleRef = await Test.createTestingModule({
    controllers: [SuscripcionesController],
    providers: [
      SuscripcionesService,
      { provide: RepositorioPlanes, useValue: new RepositorioPlanesMemoria(planes) },
      { provide: RepositorioSuscripciones, useValue: new RepositorioSuscripcionesMemoria(planes) },
      { provide: Reloj, useValue: new RelojFijo() },
    ],
  }).compile();
  return moduleRef.get(SuscripcionesController);
}

describe("SuscripcionesController", () => {
  it("health del módulo", async () => {
    const controller = await controlador();
    expect(controller.health()).toEqual({ status: "ok", module: "suscripciones" });
  });

  it("GET /suscripciones/planes responde sin sesión con importes y cpus como número", async () => {
    const controller = await controlador();
    const planes = await controller.planes();
    expect(planes).toHaveLength(4);
    expect(planes[0]).toEqual({
      codigo: "sandbox",
      nombre: "Sandbox",
      descripcion: "Para probar deploya con un proyecto.",
      precio30: 0,
      precio365: null,
      maxProyectos: 1,
      cpus: 0.25,
      memoriaMb: 256,
      construccionesMes: 30,
    });
  });

  it("la ruta de planes no declara guards", () => {
    expect(Reflect.getMetadata("__guards__", SuscripcionesController.prototype.planes)).toBeUndefined();
    expect(Reflect.getMetadata("__guards__", SuscripcionesController)).toBeUndefined();
  });
});
