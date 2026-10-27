import test from "node:test";
import assert from "node:assert";

import {
  cabeceraRitmo,
  diaEnQueSeAcaba,
  diasDelMes,
  ejeRitmo,
  enZonaAviso,
  estadoRitmo,
  etiquetasDeDia,
  fraseRitmo,
  indiceDeDia,
  porcentajeDeCuota,
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
  assert.strictEqual(porcentajeDeCuota(84, 150), 56);
  assert.strictEqual(porcentajeDeCuota(5, 0), 0);
});

test("El hover marca el día que está bajo el puntero", () => {
  // Día 20 de 31: el eje X cubre el mes entero, no solo los días que pasaron.
  assert.strictEqual(indiceDeDia(9 / 30, 31, 20), 9);
  assert.strictEqual(indiceDeDia(19 / 30, 31, 20), 19);
  assert.strictEqual(indiceDeDia(0.9, 31, 20), 19);
  assert.strictEqual(indiceDeDia(-1, 31, 20), 0);
  assert.strictEqual(indiceDeDia(0.5, 31, 0), null);
  assert.strictEqual(indiceDeDia(0.5, 0, 3), null);
});

test("Ya se acabaron: la frase dice el día en que se llegó a la cuota", () => {
  const diarios = [...Array(15).fill(10), 0, 0, 0, 0, 0];

  assert.strictEqual(diaEnQueSeAcaba(diarios, 150, 31), 15);
  assert.strictEqual(estadoRitmo({ ...OCTUBRE, diarios }), "agotada");
  assert.match(fraseRitmo({ ...OCTUBRE, diarios }), /Te quedaste sin construcciones el 15 oct; se reinician el 1 nov/);
});

test("Estado del ritmo según la proyección", () => {
  assert.strictEqual(estadoRitmo({ ...OCTUBRE, diarios: [7] }), "sin-proyeccion");
  assert.strictEqual(estadoRitmo({ ...OCTUBRE, diarios: Array(20).fill(5) }), "se-acaba");
  assert.strictEqual(estadoRitmo({ ...OCTUBRE, diarios: [8, ...Array(19).fill(4)] }), "aviso");
  assert.strictEqual(estadoRitmo({ ...OCTUBRE, diarios: Array(20).fill(1) }), "holgada");
  assert.match(fraseRitmo({ ...OCTUBRE, diarios: Array(20).fill(1) }), /^No te quedas sin construcciones antes del 1 nov\. Revertir/);
});

test("Eje Y con pasos redondos: cuota 150 → 0 · 50 · 100 · 150", () => {
  assert.deepStrictEqual(ejeRitmo(150), { tope: 150, marcas: [0, 50, 100, 150] });
  assert.deepStrictEqual(ejeRitmo(1000), { tope: 1000, marcas: [0, 500, 1000] });
  assert.deepStrictEqual(ejeRitmo(155), { tope: 200, marcas: [0, 100, 200] });
  assert.deepStrictEqual(ejeRitmo(0), { tope: 1, marcas: [0, 1] });
  assert.deepStrictEqual(ejeRitmo(2), { tope: 2, marcas: [0, 1, 2] });
});
