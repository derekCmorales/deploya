import type { TiemposDespliegue } from "../../../construccion/dominio/tiempos-despliegue";
import { medianaSaludables, porcentajeConstruccion, resumenTiempos } from "./tiempos.dominio";

const SEGUNDO_MS = 1000;

function tiempos(numero: number, construccionMs: number, restoMs: number, extra: Partial<TiemposDespliegue> = {}): TiemposDespliegue {
  return {
    numero,
    creado: new Date("2026-10-20T12:00:00.000Z"),
    estado: "saludable",
    reversion: false,
    etapas: { recepcion: restoMs, construccion: construccionMs, ejecucion: 0, enrutamiento: 0, operacion: 0 },
    falloEn: null,
    ...extra,
  };
}

describe("SP-14 · Tiempo por etapa · dominio", () => {
  it("con un número par de Saludables la mediana es el promedio de los dos del centro", () => {
    const saludables = [10, 20, 30, 41].map((segundos, i) => tiempos(i + 1, 0, segundos * SEGUNDO_MS));

    expect(medianaSaludables(saludables)).toBe(25_000);
  });

  it("sin Saludables ni tiempos medidos todo vale 0 y no hay reversión", () => {
    const fallido = tiempos(1, 0, 0, { estado: "fallido", falloEn: "recepcion" });

    expect(medianaSaludables([fallido])).toBe(0);
    expect(porcentajeConstruccion([fallido])).toBe(0);
    expect(resumenTiempos([])).toEqual({
      medianaMs: 0,
      porcentajeConstruccion: 0,
      fallos: { fallidos: 0, total: 0 },
      ultimaReversion: null,
    });
  });

  it("el % de Construcción se calcula sobre el tiempo de todos los despliegues mostrados", () => {
    const despliegues = [tiempos(1, 72 * SEGUNDO_MS, 28 * SEGUNDO_MS), tiempos(2, 0, 0, { reversion: true })];

    expect(porcentajeConstruccion(despliegues)).toBe(72);
  });
});
