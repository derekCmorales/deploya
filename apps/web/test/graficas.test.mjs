import test from "node:test";
import assert from "node:assert";

import { escalaLineal, ticks } from "../src/components/deploya/graficas/escalas.ts";
import {
  detallePunto,
  eventoEnX,
  indiceAlMover,
  indiceMasCercano,
  puntosDeSerie,
} from "../src/components/deploya/graficas/series.ts";
import { etiquetaMomento, etiquetasDeTiempo, tonoDeUso } from "../src/lib/metricas.ts";

test("escalaLineal en los extremos", () => {
  const escala = escalaLineal([0, 100], [0, 200]);
  assert.strictEqual(escala(0), 0);
  assert.strictEqual(escala(50), 100);
  assert.strictEqual(escala(100), 200);
});

test("ticks redondos", () => {
  const t = ticks(100, 4);
  assert.strictEqual(t.length, 5);
  assert.strictEqual(t[0], 0);
  assert.strictEqual(t[4], 100);
});

test("Un hueco corta la línea", () => {
  const muestras = [
    { tiempo: "2026-10-23T10:00:00Z", valor: 10 },
    { tiempo: "2026-10-23T10:01:00Z", valor: 15 },
    { tiempo: "2026-10-23T10:05:00Z", valor: 20 },
  ];
  const segmentos = puntosDeSerie(muestras, 120000);
  assert.strictEqual(segmentos.length, 2);
  assert.strictEqual(segmentos[0].length, 2);
  assert.strictEqual(segmentos[1].length, 1);
  assert.deepStrictEqual(
    segmentos[1].map((punto) => punto.indice),
    [2],
  );
});

test("Tono de aviso desde el 80 %", () => {
  const limite = 100;
  assert.strictEqual(tonoDeUso(79, limite), "normal");
  assert.strictEqual(tonoDeUso(80, limite), "aviso");
  assert.strictEqual(tonoDeUso(100, limite), "aviso");
});

test("Hover y teclado", () => {
  const muestras = [
    { tiempo: "2026-10-20T16:00:00Z", valor: 420 },
    { tiempo: "2026-10-20T17:00:00Z", valor: 430 },
    { tiempo: "2026-10-20T18:00:00Z", valor: 425 },
  ];
  const despliegues = [
    { en: "2026-10-20T12:00:00Z", version: 13 },
    { en: "2026-10-20T17:30:00Z", version: 14 },
  ];
  const ahora = new Date("2026-10-20T18:00:00Z");

  assert.strictEqual(indiceAlMover(null, "ArrowRight", 3), 0);
  assert.strictEqual(indiceAlMover(2, "ArrowRight", 3), 0);
  assert.strictEqual(indiceAlMover(0, "ArrowLeft", 3), 2);
  assert.strictEqual(indiceAlMover(1, "Escape", 3), null);

  assert.strictEqual(indiceMasCercano(muestras, 0.5, "2026-10-20T16:00:00Z", "2026-10-20T18:00:00Z"), 1);

  const enElMedio = detallePunto(muestras, 1, 512, despliegues);
  assert.strictEqual(enElMedio.valor, 430);
  assert.strictEqual(enElMedio.porcentaje, 84);
  assert.strictEqual(enElMedio.version, "#13");
  assert.strictEqual(etiquetaMomento(muestras[1].tiempo, ahora), "hoy 17:00");

  const alFinal = detallePunto(muestras, 2, 512, despliegues);
  assert.strictEqual(alFinal.version, "#14");
});

test("Los eventos caen en su hora", () => {
  const inicio = "2026-10-19T18:30:00Z";
  const fin = "2026-10-20T18:00:00Z";
  const ancho = 960;
  const evento = { en: "2026-10-20T13:00:00Z", version: 14 };

  const x = eventoEnX(evento, inicio, fin, ancho);
  const esperado = ((Date.parse(evento.en) - Date.parse(inicio)) / (Date.parse(fin) - Date.parse(inicio))) * ancho;
  assert.ok(x !== null && Math.abs(x - esperado) < 1e-6);

  assert.strictEqual(eventoEnX({ en: "2026-10-20T19:00:00Z", version: 14 }, inicio, fin, ancho), null);
  assert.strictEqual(eventoEnX({ en: "2026-10-19T18:00:00Z", version: 13 }, inicio, fin, ancho), null);
});

test("Las horas del eje caen en punto", () => {
  const marcas = etiquetasDeTiempo(
    "2026-10-19T18:30:00Z",
    "2026-10-20T18:00:00Z",
    new Date("2026-10-20T18:00:00Z"),
  );

  assert.deepStrictEqual(
    marcas.map((marca) => marca.texto),
    ["ayer 18:30", "00:00", "06:00", "12:00", "ahora"],
  );
  const esperadas = [0, 5.5 / 23.5, 11.5 / 23.5, 17.5 / 23.5, 1];
  marcas.forEach((marca, indice) => {
    assert.ok(Math.abs(marca.fraccion - esperadas[indice]) < 1e-12);
  });
});
