import test from "node:test";
import assert from "node:assert";
import { proyectar, diaEnQueSeAcaba } from "../src/lib/proyeccion.ts";

test("Proyección en zona de aviso (84 en 20 de 31 con cuota 150)", () => {
  const diarios = Array(20).fill(4.2);
  const proyeccion = proyectar(diarios, 31);
  assert.ok(proyeccion >= 125 && proyeccion <= 135, `Proyección esperada ~130, obtuvo ${proyeccion}`);
});

test("Primer día maneja estado inicial correctamente", () => {
  const diarios = [2];
  const proyeccion = proyectar(diarios, 30);
  assert.strictEqual(proyeccion, 60);
});

test("Meses de 28 días (Febrero) no rompen la proyección", () => {
  const diarios = Array(10).fill(5);
  const proyeccion = proyectar(diarios, 28);
  assert.strictEqual(proyeccion, 140);
});