import { RelojFijo } from "../../../compartido/reloj";
import { ConsumoService } from "./consumo.service";

describe("ConsumoService (M7-03)", () => {
  it("Consumo cerca del límite", async () => {
    const reloj = new RelojFijo(new Date("2026-10-14T12:00:00.000Z"));
    
    // Dobles / stubs simulando los puertos
    const desplieguesMock = {
      contarConstruccionesDesde: async () => 96,
    };
    const proyectosLecturaMock = {
      deUsuario: async () => [{ id: "p1" }, { id: "p2" }, { id: "p3" }],
    };
    const cuotaPlanMock = {
      permisoDe: async () => ({ estado: "activa" as const, construccionesMes: 150 }),
    };
    const cuotaProyectosMock = {
      cuotaDe: async () => ({ maxProyectos: 3 }),
    };

    const service = new ConsumoService(
      reloj,
      desplieguesMock as any,
      proyectosLecturaMock as any,
      cuotaPlanMock as any,
      cuotaProyectosMock as any,
    );

    const resultado = await service.de("usuario-1");

    expect(resultado.proyectos).toEqual({ usados: 3, limite: 3 });
    expect(resultado.construcciones).toEqual({ usadas: 96, limite: 150 });
    expect(resultado.periodo.reinicia).toEqual(new Date("2026-11-01T00:00:00.000Z"));
  });
});