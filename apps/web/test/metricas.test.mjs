import test from "node:test";
import assert from "node:assert";
import { estadoEnPalabra, deltaPorVersion, textoBanner } from "../src/lib/metricas.ts";

test("estadoEnPalabra en sus bordes (79 %, 80 %, 100 %)", () => {
  assert.strictEqual(estadoEnPalabra(79), "Holgada");
  assert.strictEqual(estadoEnPalabra(80), "Cerca del límite");
  assert.strictEqual(estadoEnPalabra(100), "Al límite");
});

test("deltaPorVersion calcula correctamente el cambio", () => {
  assert.strictEqual(deltaPorVersion(430, 340, "MB"), "▲ 90 MB desde la versión previa");
  assert.strictEqual(deltaPorVersion(340, 340, "MB"), "Sin cambios desde la versión anterior");
});

test("textoBanner genera el mensaje exacto", () => {
  const msg = textoBanner(84, "Starter", "▲ 90 MB desde la versión previa");
  assert.strictEqual(msg, "La memoria está al 84 % del límite de Starter. ▲ 90 MB desde la versión previa");
});