import { periodoDe } from "./periodo";
import { diariosDe } from "./ritmo";

function fecha(iso: string): Date {
  return new Date(iso);
}

describe("Ritmo diario de construcciones (SP-15)", () => {
  it("día 1", () => {
    const hoy = fecha("2026-10-01T18:00:00.000Z");

    const diarios = diariosDe([fecha("2026-10-01T09:00:00.000Z"), fecha("2026-10-01T17:00:00.000Z")], periodoDe(hoy), hoy);

    expect(diarios).toEqual([2]);
  });

  it("despliegues de otro mes no cuentan", () => {
    const hoy = fecha("2026-10-14T12:00:00.000Z");
    const fechas = [fecha("2026-09-30T23:59:59.000Z"), fecha("2026-10-02T10:00:00.000Z")];

    const diarios = diariosDe(fechas, periodoDe(hoy), hoy);

    expect(diarios).toHaveLength(14);
    expect(diarios[0]).toBe(0);
    expect(diarios[1]).toBe(1);
    expect(diarios.reduce((total, dia) => total + dia, 0)).toBe(1);
  });

  it("febrero", () => {
    const hoy = fecha("2026-02-28T20:00:00.000Z");
    const fechas = [fecha("2026-02-01T08:00:00.000Z"), fecha("2026-02-28T19:00:00.000Z")];

    const diarios = diariosDe(fechas, periodoDe(hoy), hoy);

    expect(diarios).toHaveLength(28);
    expect(diarios[0]).toBe(1);
    expect(diarios[27]).toBe(1);
  });
});
