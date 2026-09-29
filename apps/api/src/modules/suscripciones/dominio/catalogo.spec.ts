import { planesDePrueba } from "../adaptadores/planes.fixture";
import { catalogoDe, cuotaDeSuscripcion } from "./catalogo";

describe("catalogoDe", () => {
  it("solo planes activos, ordenados", () => {
    const [sandbox, starter, pro, business] = planesDePrueba();
    const catalogo = catalogoDe([business, { ...pro, activo: false }, sandbox, starter]);
    expect(catalogo.map((p) => p.codigo)).toEqual(["sandbox", "starter", "business"]);
  });

  it("no expone id, orden ni activo", () => {
    const [plan] = catalogoDe(planesDePrueba());
    expect(Object.keys(plan).sort()).toEqual(
      ["codigo", "construccionesMes", "cpus", "descripcion", "maxProyectos", "memoriaMb", "nombre", "precio30", "precio365"].sort(),
    );
  });
});

describe("cuotaDeSuscripcion", () => {
  it("copia los límites del plan, el estado y el vencimiento", () => {
    const pro = planesDePrueba()[2];
    const vence = new Date("2026-10-30T00:00:00.000Z");
    const cuota = cuotaDeSuscripcion({
      id: "s1",
      usuarioId: "u1",
      plan: pro,
      estado: "por-vencer",
      vigenciaDias: 30,
      inicio: new Date("2026-09-30T00:00:00.000Z"),
      vence,
    });
    expect(cuota).toEqual({
      plan: { codigo: "pro", nombre: "Pro" },
      estado: "por-vencer",
      vence,
      maxProyectos: 10,
      cpus: 1,
      memoriaMb: 1024,
      construccionesMes: 500,
    });
  });
});
