import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { formatoCuentaAtras, puedeReenviar, resultadoReenvio } from "../src/lib/reenvio.ts";

const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), "utf8");

test("02 · la cuenta atrás se muestra como m:ss", () => {
  assert.equal(formatoCuentaAtras(42), "0:42");
  assert.equal(formatoCuentaAtras(60), "1:00");
  assert.equal(formatoCuentaAtras(5), "0:05");
  assert.equal(formatoCuentaAtras(0), "0:00");
});

test("02 · en cero el botón se habilita; mientras corre, no", () => {
  assert.equal(puedeReenviar(0), true);
  assert.equal(puedeReenviar(-1), true);
  assert.equal(puedeReenviar(1), false);
});

test("Reenvío antes de la cuenta atrás: el 429 arranca la cuenta atrás con los segundos de la API", () => {
  assert.deepEqual(resultadoReenvio(429, "EsperaReenvio", 40), { tipo: "esperar", segundos: 40 });
});

test("Reenviar verificación: el 202 neutro arranca la cuenta atrás de 60 s que manda la API", () => {
  assert.deepEqual(resultadoReenvio(202, "", 60), { tipo: "enviado", segundos: 60 });
});

test("02 · otro fallo es un error genérico y no arranca la cuenta atrás", () => {
  assert.equal(resultadoReenvio(500, "http-500", undefined).tipo, "error");
  assert.equal(resultadoReenvio(0, "sin-conexion", undefined).tipo, "error");
  assert.deepEqual(resultadoReenvio(429, "EsperaReenvio", "x"), { tipo: "esperar", segundos: 0 });
});

test("02 y 03b · «Reenviar correo» con la cuenta atrás y el texto de la ficha 02", () => {
  const boton = leer("src/app/(auth)/verificar/boton-reenviar.tsx");
  const verificacion = leer("src/app/(auth)/verificar/verificacion.tsx");
  const ingreso = leer("src/app/(auth)/ingresar/formulario-ingreso.tsx");

  assert.match(boton, /`Reenviar correo · \$\{formatoCuentaAtras\(segundos\)\}`/);
  assert.match(boton, /Podrás reenviarlo cuando termine la cuenta atrás\./);
  assert.match(boton, /type="button"/, "en 03b vive dentro del formulario del login: no debe enviarlo");
  assert.match(verificacion, /<BotonReenviar destino=\{\{ correo: correoReal \}\} \/>/);
  assert.match(verificacion, /<BotonReenviar destino=\{\{ token \}\} \/>/);
  assert.match(ingreso, /actions=\{<BotonReenviar destino=\{\{ correo: correo\.trim\(\) \}\} compacto \/>\}/);
  assert.match(leer("src/app/(auth)/registro/formulario-registro.tsx"), /guardarCorreoPendiente\(correo\)/);
});

test("02 · el reenvío usa pedirApi y las pantallas no hacen fetch ni usan colores de Tailwind", () => {
  assert.match(leer("src/lib/api-identidad.ts"), /pedirApi<\{ segundos\?: number \}>\("\/identidad\/verificacion\/reenvio"/);
  for (const ruta of ["src/app/(auth)/verificar/boton-reenviar.tsx", "src/app/(auth)/verificar/verificacion.tsx"]) {
    const codigo = leer(ruta);
    assert.doesNotMatch(codigo, /\bfetch\(/, `fetch en ${ruta}`);
    assert.doesNotMatch(codigo, /\b(?:bg|text|border)-(?:red|green|emerald|blue|yellow|amber|slate|gray)-\d/, `color de Tailwind en ${ruta}`);
    assert.doesNotMatch(codigo, /#[0-9a-fA-F]{3,8}\b/, `hex en ${ruta}`);
  }
});
