import test from "node:test";
import assert from "node:assert";

import {
  consultaTiempos,
  duracionTotal,
  formatoDuracion,
  indicadoresTiempos,
  minutosDelEje,
  resumenAccesible,
  subtituloTiempos,
  textoTramo,
  tramosVisibles,
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

test("Dónde falló", () => {
  const once = despliegue(11, 0, {
    estado: "fallido",
    etapas: { recepcion: 4_000, construccion: 5_000, ejecucion: 0, enrutamiento: 0, operacion: 0 },
    falloEn: "construccion",
  });

  const visibles = tramosVisibles(once);

  assert.deepStrictEqual(
    visibles.map((tramo) => tramo.etapa),
    ["recepcion", "construccion"],
  );
  assert.strictEqual(visibles.at(-1).fallo, true);
  assert.strictEqual(visibles[0].fallo, false);
});

test("Reversión", () => {
  const siete = despliegue(7, 0, {
    reversion: true,
    etapas: { recepcion: 0, construccion: 0, ejecucion: 21_000, enrutamiento: 9_000, operacion: 18_000 },
  });

  const visibles = tramosVisibles(siete);

  assert.deepStrictEqual(
    visibles.map((tramo) => tramo.etapa),
    ["ejecucion", "enrutamiento", "operacion"],
  );
  assert.strictEqual(duracionTotal(siete), 48_000);
  assert.strictEqual(textoTramo(siete.etapas.construccion), "omitida");
  assert.strictEqual(textoTramo(siete.etapas.ejecucion), "21 s");
});

test("minutosDelEje redondea hacia arriba y nunca baja de 1 min", () => {
  assert.strictEqual(minutosDelEje([despliegue(1, 164_000), despliegue(2, 20_000)]), 3);
  assert.strictEqual(minutosDelEje([despliegue(1, 0)]), 1);
});

test("resumenAccesible usa la mediana de la API y cuenta los fallidos", () => {
  const despliegues = [despliegue(1, 20_000), despliegue(2, 60_000), despliegue(3, 120_000, { estado: "fallido" })];

  assert.strictEqual(resumenAccesible(despliegues, 40_000), "3 despliegues. Mediana 40 s. 1 fallido de 3.");
  assert.strictEqual(resumenAccesible(despliegues.slice(0, 2), 40_000), "2 despliegues. Mediana 40 s. 0 fallidos de 2.");
});

test("subtituloTiempos dice cuántos despliegues llegaron", () => {
  assert.strictEqual(subtituloTiempos(14, "api-tienda"), "Últimos 14 despliegues de api-tienda");
  assert.strictEqual(subtituloTiempos(5, "api-tienda"), "Últimos 5 despliegues de api-tienda");
  assert.strictEqual(subtituloTiempos(1, "api-tienda"), "Último despliegue de api-tienda");
});

test("consultaTiempos pide como máximo los últimos 14", () => {
  assert.strictEqual(consultaTiempos("api-tienda"), "/proyectos/api-tienda/despliegues/tiempos?ultimos=14");
  assert.strictEqual(consultaTiempos("api-tienda", 3), "/proyectos/api-tienda/despliegues/tiempos?ultimos=3");
  assert.strictEqual(consultaTiempos("api-tienda", 99), "/proyectos/api-tienda/despliegues/tiempos?ultimos=14");
  assert.strictEqual(consultaTiempos("api-tienda", 0), "/proyectos/api-tienda/despliegues/tiempos?ultimos=14");
});
