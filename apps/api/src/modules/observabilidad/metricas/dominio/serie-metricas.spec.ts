import type { Muestra } from "../../../orquestacion/puertos/muestras-metricas.puerto";
import { desdeDe, muestrasEnVentana, picoDe, serieDe } from "./serie-metricas";

const AHORA = new Date("2026-10-20T18:10:00.000Z");

function muestra(tomada: string, cpu: number, memoriaMb: number): Muestra {
  return { despliegueId: "d1", version: 1, tomada: new Date(tomada), cpu, memoriaMb };
}

describe("Serie de métricas (dominio)", () => {
  it("el pico de 24 h es el máximo de las muestras crudas, no de los promedios", () => {
    const muestras = [
      muestra("2026-10-20T14:00:10.000Z", 0.1, 452),
      muestra("2026-10-20T14:01:10.000Z", 0.1, 100),
      muestra("2026-10-20T03:30:10.000Z", 0.27, 200),
    ];

    const pico = picoDe(muestras);

    expect(pico.memoriaMb).toEqual({ valor: 452, en: new Date("2026-10-20T14:00:10.000Z") });
    expect(pico.cpu).toEqual({ valor: 0.27, en: new Date("2026-10-20T03:30:10.000Z") });
    expect(serieDe(muestras, "24h", AHORA).find((punto) => punto.en.getUTCHours() === 14)?.memoriaMb).toBe(276);
  });

  it("sin muestras el pico es nulo", () => {
    expect(picoDe([])).toEqual({ cpu: null, memoriaMb: null });
  });

  it("en un empate el pico es la muestra más antigua", () => {
    const pico = picoDe([muestra("2026-10-20T10:05:00.000Z", 0.2, 300), muestra("2026-10-20T10:01:00.000Z", 0.2, 300)]);

    expect(pico.cpu?.en).toEqual(new Date("2026-10-20T10:01:00.000Z"));
    expect(pico.memoriaMb?.en).toEqual(new Date("2026-10-20T10:01:00.000Z"));
  });

  it("la ventana de 24 h empieza 47 cubos antes del cubo que contiene ahora", () => {
    expect(desdeDe(AHORA, "24h")).toEqual(new Date("2026-10-19T18:30:00.000Z"));
    expect(desdeDe(new Date("2026-10-20T18:30:00.000Z"), "24h")).toEqual(new Date("2026-10-19T19:00:00.000Z"));
    expect(desdeDe(new Date("2026-10-20T18:29:59.999Z"), "24h")).toEqual(new Date("2026-10-19T18:30:00.000Z"));
  });

  it("la ventana de 1 h son los 60 min previos", () => {
    expect(desdeDe(AHORA, "1h")).toEqual(new Date("2026-10-20T17:10:00.000Z"));
  });

  it("descarta lo anterior al primer cubo y lo posterior a ahora", () => {
    const dentro = muestra("2026-10-19T18:30:00.000Z", 0.1, 10);
    const antes = muestra("2026-10-19T18:29:59.000Z", 0.1, 10);
    const futura = muestra("2026-10-20T18:10:01.000Z", 0.1, 10);

    expect(muestrasEnVentana([futura, dentro, antes], "24h", AHORA)).toEqual([dentro]);
  });

  it("una muestra en la frontera :30 abre el cubo siguiente", () => {
    const serie = serieDe([muestra("2026-10-20T17:29:59.000Z", 0.1, 10), muestra("2026-10-20T17:30:00.000Z", 0.3, 30)], "24h", AHORA);

    expect(serie.map((punto) => punto.en.toISOString())).toEqual(["2026-10-20T17:00:00.000Z", "2026-10-20T17:30:00.000Z"]);
  });
});
