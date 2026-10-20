import test from "node:test";
import assert from "node:assert";
import { textoActividad, textoReinicio } from "../src/lib/actividad.ts";

const DIAS_ACTIVIDAD = 84;

function ventana(conDespliegues) {
  const dias = Array.from({ length: DIAS_ACTIVIDAD }, (_, i) => ({ fecha: `dia-${i}`, total: 0, fallidos: 0 }));
  for (const [indice, total, fallidos] of conDespliegues) dias[indice] = { ...dias[indice], total, fallidos };
  return dias;
}

test("Actividad de 12 semanas: 84 días con 38 despliegues y 2 fallidos", () => {
  const dias = ventana([[0, 20, 0], [40, 16, 1], [83, 2, 1]]);
  assert.strictEqual(textoActividad(dias), "12 semanas · 38 despliegues · 2 con fallo");
});

test("textoActividad sin despliegues sigue nombrando la ventana", () => {
  assert.strictEqual(textoActividad(ventana([])), "12 semanas · 0 despliegues · 0 con fallo");
});

test("Mes nuevo: el período de octubre se reinicia el 1 nov", () => {
  assert.strictEqual(textoReinicio(new Date("2026-11-01T00:00:00.000Z")), "Se reinicia el 1 nov");
  assert.strictEqual(textoReinicio("2027-01-01T00:00:00.000Z"), "Se reinicia el 1 ene");
});
