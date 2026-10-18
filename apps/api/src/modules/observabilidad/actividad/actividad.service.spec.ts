import { Test, TestingModule } from "@nestjs/testing";
import { ActividadService } from "./actividad.service";
import { Reloj } from "../../../compartido/reloj";
import { RepositorioDespliegues } from "../../construccion/puertos/repositorio-despliegues.puerto";
import { DetalleProyectoPuerto } from "../puertos/detalle-proyecto.puerto";
import { ProyectoNoEncontrado } from "../../construccion/dominio/errores";

describe("ActividadService", () => {
  let servicio: ActividadService;
  let repoDesplieguesMock: Partial<RepositorioDespliegues>;
  let detalleProyectoMock: Partial<DetalleProyectoPuerto>;
  let relojMock: Partial<Reloj>;

  beforeEach(async () => {
    repoDesplieguesMock = {
      desplieguesDesde: async () => [
        { creado: new Date("2026-10-01T10:00:00.000Z"), estado: "saludable" as any },
        { creado: new Date("2026-10-02T10:00:00.000Z"), estado: "fallido" as any },
      ],
    };

    detalleProyectoMock = {
      porId: async (id: string) => {
        if (id === "proj-1") {
          return { id: "proj-1", usuarioId: "user-1", nombre: "mi-proyecto" } as any;
        }
        return null;
      },
    };

    relojMock = {
      ahora: () => new Date("2026-10-15T00:00:00.000Z"),
    };

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        ActividadService,
        { provide: Reloj, useValue: relojMock },
        { provide: RepositorioDespliegues, useValue: repoDesplieguesMock },
        { provide: DetalleProyectoPuerto, useValue: detalleProyectoMock },
      ],
    }).compile();

    servicio = modulo.get<ActividadService>(ActividadService);
  });

  it("lanza ProyectoNoEncontrado si el proyecto no existe o no pertenece al usuario", async () => {
    await expect(servicio.de("proj-inexistente", "user-1")).rejects.toThrow(ProyectoNoEncontrado);
    await expect(servicio.de("proj-1", "usuario-ajeno")).rejects.toThrow(ProyectoNoEncontrado);
  });

  it("devuelve la actividad agrupada y conteo total y fallidos correctamente", async () => {
    const resultado = await servicio.de("proj-1", "user-1");
    expect(resultado.total).toBe(2);
    expect(resultado.fallidos).toBe(1);
    expect(resultado.dias.length).toBe(84);
  });
});