import test from "node:test";
import assert from "node:assert";

import {
  consultaTiempos,
  formatoDuracion,
  indicadoresTiempos,
  medianaSaludables,
  resumenAccesible,
} from "../src/lib/tiempos.ts";

const RESUMEN = {
  medianaMs: 164_000,
  porcentajeConstruccion: 72,
  fallos: { fallidos: 2, total: 14 },
  ultimaReversion: { numero: 7, ms: 38_000 },
};

function despliegue(numero, totalMs, extra = {}) {
  return {
    numero,
    creado: "2026-10-20T12:00:00.000Z",
    estado: "saludable",
    reversion: false,
    etapas: { recepcion: totalMs, construccion: 0, ejecucion: 0, enrutamiento: 0, operacion: 0 },
    falloEn: null,
    ...extra,
  };
}

test("formatoDuracion cubre segundos, minutos y cero", () => {
  assert.strictEqual(formatoDuracion(0), "0 s");
  assert.strictEqual(formatoDuracion(38_000), "38 s");
  assert.strictEqual(formatoDuracion(164_000), "2 min 44 s");
  assert.strictEqual(formatoDuracion(60_000), "1 min 0 s");
});

test("indicadoresTiempos arma los cuatro textos de la cabecera", () => {
  assert.deepStrictEqual(indicadoresTiempos(RESUMEN), {
    mediana: "2 min 44 s",
    construccion: "72 % del tiempo",
    fallos: "2 de 14",
    reversion: "38 s · sin construir",
  });
  assert.strictEqual(indicadoresTiempos({ ...RESUMEN, ultimaReversion: null }).reversion, "Sin reversiones");
});

test("medianaSaludables ignora fallidos y reversiones", () => {
  const despliegues = [
    despliegue(1, 10_000),
    despliegue(2, 20_000),
    despliegue(3, 60_000),
    despliegue(4, 900_000, { estado: "fallido" }),
    despliegue(5, 800_000, { reversion: true }),
  ];

  assert.strictEqual(medianaSaludables(despliegues), 20_000);
});

test("resumenAccesible cuenta los despliegues y los fallidos", () => {
  const despliegues = [despliegue(1, 20_000), despliegue(2, 60_000), despliegue(3, 120_000, { estado: "fallido" })];

  assert.strictEqual(resumenAccesible(despliegues), "3 despliegues. Mediana 40 s. 1 fallido de 3.");
});

test("consultaTiempos pide como máximo los últimos 14", () => {
  assert.strictEqual(consultaTiempos("api-tienda"), "/proyectos/api-tienda/despliegues/tiempos?ultimos=14");
  assert.strictEqual(consultaTiempos("api-tienda", 3), "/proyectos/api-tienda/despliegues/tiempos?ultimos=3");
  assert.strictEqual(consultaTiempos("api-tienda", 99), "/proyectos/api-tienda/despliegues/tiempos?ultimos=14");
  assert.strictEqual(consultaTiempos("api-tienda", 0), "/proyectos/api-tienda/despliegues/tiempos?ultimos=14");
});
