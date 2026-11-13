import test from "node:test";
import assert from "node:assert";

import { readFileSync } from "node:fs";

import { debeSeguirTrasError } from "../src/lib/reintento.ts";
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

test("Tras un error, un sondeo en marcha sigue si fue la red o el servidor; un 4xx o una lectura única, no", () => {
  assert.equal(debeSeguirTrasError(0, true), true, "sin conexión");
  assert.equal(debeSeguirTrasError(502, true), true, "502 mientras se reinicia");
  assert.equal(debeSeguirTrasError(401, true), false, "un 4xx no cambia reintentando");
  assert.equal(debeSeguirTrasError(404, true), false);
  assert.equal(debeSeguirTrasError(0, false), false, "una lectura única que falla no se repite");
});

const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), "utf8");

test("La cabecera del proyecto se mantiene al día: sondea, y el detalle y «Desplegar» le avisan", () => {
  const marco = leer("src/app/(projects)/projects/_componentes/marco-proyecto.tsx");
  assert.match(marco, /useProyectos\(\)/, "la cabecera no sondea la lista");
  assert.doesNotMatch(marco, /sondear: false/, "la cabecera leería el estado una sola vez y quedaría congelada");

  const sondeoHook = leer("src/hooks/use-sondeo.ts");
  assert.match(sondeoHook, /debeSeguirTrasError/, "un error de red mata el sondeo y congela la pantalla");

  assert.match(leer("src/hooks/use-proyectos.ts"), /visibilitychange/, "al volver a la pestaña no se refresca");
  assert.match(leer("src/app/(projects)/projects/_componentes/panel-despliegue.tsx"), /useAvisoCambioDeEstado/);
  assert.match(leer("src/app/(projects)/projects/_componentes/panel-resumen.tsx"), /useAvisoCambioDeEstado/);
  assert.match(leer("src/app/(projects)/projects/_componentes/boton-desplegar.tsx"), /avisarProyectoActualizado\(\)/);
});
