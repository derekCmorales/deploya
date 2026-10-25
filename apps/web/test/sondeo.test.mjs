import test from "node:test";
import assert from "node:assert";

import { iniciarSondeo } from "../src/lib/sondeo.ts";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

test("El sondeo se reprograma después de un fallo", async () => {
  let llamadas = 0;
  const programadas = [];
  const sondeo = iniciarSondeo(
    async () => {
      llamadas += 1;
      if (llamadas === 1) throw new Error("sin conexión");
    },
    1_000,
    (accion, ms) => {
      programadas.push({ accion, ms });
      return programadas.length;
    },
    () => {},
  );

  await flush();
  assert.strictEqual(llamadas, 1);
  assert.strictEqual(programadas.length, 1);
  assert.strictEqual(programadas[0].ms, 1_000);

  await programadas[0].accion();
  assert.strictEqual(llamadas, 2);
  assert.strictEqual(programadas.length, 2);

  sondeo.detener();
  await programadas[1].accion();
  assert.strictEqual(programadas.length, 2, "detenido no vuelve a programar");
});
