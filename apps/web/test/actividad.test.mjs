import test from "node:test";
import assert from "node:assert";
import { textoActividad, textoReinicio } from "../src/lib/actividad.ts";

test("textoActividad resume correctamente los despliegues y fallos", () => {
  const dias = [
    { fecha: "2026-07-23", total: 2, fallidos: 0 },
    { fecha: "2026-10-14", total: 1, fallidos: 1 },
  ];
  assert.strictEqual(textoActividad(dias), "12 semanas · 3 despliegues · 1 con fallo");
});

test("textoReinicio formatea correctamente la fecha UTC", () => {
  const fecha = new Date("2026-11-01T00:00:00.000Z");
  assert.strictEqual(textoReinicio(fecha), "Se reinicia el 1 nov");
});