import { medianaDe, porcentajeDe } from "./tiempos.dominio";

describe("Tiempos Dominio - M7", () => {
  it("Mediana", () => {
    expect(medianaDe([12, 15, 20])).toBe(15);
    expect(medianaDe([10, 20, 30, 40])).toBe(25);
  });

  it("Dónde falló", () => {
    const pct = porcentajeDe("build", [{ etapas: { build: 60, clonacion: 40 } }]);
    expect(pct).toBe(60);
  });

  it("Reversión", () => {
    const medianaRev = medianaDe([18]);
    expect(medianaRev).toBe(18);
  });
});