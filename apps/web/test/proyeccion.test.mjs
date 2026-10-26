import test from "node:test";
import assert from "node:assert";

import {
  cabeceraRitmo,
  diaEnQueSeAcaba,
  diasDelMes,
  enZonaAviso,
  etiquetasDeDia,
  fraseRitmo,
  indiceDeDia,
  promedioPorDia,
  proyectar,
  puntosRitmo,
} from "../src/lib/proyeccion.ts";

const OCTUBRE = {
  desde: "2026-10-01T00:00:00.000Z",
  reinicia: "2026-11-01T00:00:00.000Z",
  cuota: 150,
};

test("Proyección en zona de aviso", () => {
  const diarios = [8, ...Array(19).fill(4)];
  const proyeccion = proyectar(diarios, 31);

  assert.strictEqual(proyeccion, 130);
  assert.strictEqual(enZonaAviso(proyeccion, 150), true);
  assert.strictEqual(diasDelMes(OCTUBRE.desde, OCTUBRE.reinicia), 31);

  const frase = fraseRitmo({ ...OCTUBRE, diarios });
  assert.match(frase, /zona de aviso/);
  assert.match(frase, /1 nov/);
});

test("Se acaba antes", () => {
  const diarios = Array(20).fill(5);

  assert.strictEqual(diaEnQueSeAcaba(diarios, 150, 31), 30);
  const frase = fraseRitmo({ ...OCTUBRE, diarios });
  assert.match(frase, /sin construcciones el 30 oct/);
});

test("Primer día", () => {
  assert.strictEqual(proyectar([7], 31), null);
  const frase = fraseRitmo({ ...OCTUBRE, diarios: [7] });
  assert.match(frase, /no hay suficientes días/);
});

test("Febrero", () => {
  const desde = "2026-02-01T00:00:00.000Z";
  const reinicia = "2026-03-01T00:00:00.000Z";

  assert.strictEqual(diasDelMes(desde, reinicia), 28);
  const etiquetas = etiquetasDeDia(desde, 28);
  assert.deepStrictEqual(
    etiquetas.map((etiqueta) => etiqueta.texto),
    ["01 feb", "08 feb", "15 feb", "22 feb", "28 feb"],
  );
  assert.strictEqual(proyectar(Array(10).fill(5), 28), 140);
});

test("Mes de 30", () => {
  const desde = "2026-04-01T00:00:00.000Z";
  const reinicia = "2026-05-01T00:00:00.000Z";

  assert.strictEqual(diasDelMes(desde, reinicia), 30);
  assert.strictEqual(proyectar(Array(10).fill(6), 30), 180);
  assert.strictEqual(etiquetasDeDia(desde, 30).at(-1)?.texto, "30 abr");
});

test("Cabecera, promedio, acumulado y hover salen de los datos", () => {
  const datos = { ...OCTUBRE, diarios: [4, 5, 4] };

  assert.strictEqual(cabeceraRitmo(datos, "Starter"), "Octubre · Starter, 150 por mes · se reinicia el 1 nov");
  assert.strictEqual(promedioPorDia(datos.diarios), "4.3");

  const puntos = puntosRitmo(datos.diarios);
  assert.deepStrictEqual(
    puntos.map((punto) => punto.acumulado),
    [4, 9, 13],
  );
  assert.strictEqual(indiceDeDia(0.5, 3), 1);
  assert.strictEqual(indiceDeDia(-1, 3), 0);
  assert.strictEqual(indiceDeDia(2, 3), 2);
  assert.strictEqual(indiceDeDia(0.5, 0), null);
});
