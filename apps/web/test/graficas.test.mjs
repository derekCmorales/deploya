import test from "node:test";
import assert from "node:assert";
import { escalaLineal, ticks } from "../src/components/deploya/graficas/escalas.ts";
import { puntosDeSerie, tonoDeUso } from "../src/components/deploya/graficas/series.ts";

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
});

test("Tono de aviso desde el 80 %", () => {
  const limite = 100;
  assert.strictEqual(tonoDeUso(79, limite), "normal");
  assert.strictEqual(tonoDeUso(80, limite), "aviso");
  assert.strictEqual(tonoDeUso(100, limite), "aviso");
});