import { ESPERA_REENVIO_MS, PoliticaReenvio } from "./politica-reenvio";

describe("M1-04 · PoliticaReenvio", () => {
  const politica = new PoliticaReenvio();
  const creado = new Date("2026-10-07T12:00:00.000Z");
  const despues = (ms: number) => new Date(creado.getTime() + ms);

  it("la espera es de 60 segundos", () => {
    expect(ESPERA_REENVIO_MS).toBe(60_000);
  });

  it("cuenta los segundos que faltan y redondea hacia arriba", () => {
    expect(politica.segundosRestantes(creado, creado)).toBe(60);
    expect(politica.segundosRestantes(creado, despues(20_000))).toBe(40);
    expect(politica.segundosRestantes(creado, despues(59_001))).toBe(1);
  });

  it("pasados los 60 segundos ya se puede reenviar", () => {
    expect(politica.segundosRestantes(creado, despues(60_000))).toBe(0);
    expect(politica.segundosRestantes(creado, despues(3_600_000))).toBe(0);
  });
});
