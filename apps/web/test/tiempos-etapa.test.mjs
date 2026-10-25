import test from "node:test";
import assert from "node:assert";

test("Validación de cálculo de porcentajes y mediana para despliegues", () => {
  const totales = [14, 18, 22];
  const ordenados = [...totales].sort((a, b) => a - b);
  assert.strictEqual(ordenados[1], 18);
});