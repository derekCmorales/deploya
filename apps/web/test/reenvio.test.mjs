import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { correoPendienteDesde } from "../src/lib/correo-pendiente.ts";
import { ESPERA_REENVIO_S, formatoCuentaAtras, puedeReenviar, resultadoReenvio, segundosTrasEnvio } from "../src/lib/reenvio.ts";

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

  assert.match(boton, /Reenviar correo\s*\{esperando \? \(\s*<>\s*\{" · "\}\s*<span className="font-mono tabular-nums">\{formatoCuentaAtras\(segundos\)\}<\/span>/);
  assert.match(boton, /Podrás reenviarlo cuando termine la cuenta atrás\./);
  assert.match(boton, /type="button"/, "en 03b vive dentro del formulario del login: no debe enviarlo");
  assert.match(verificacion, /<BotonReenviar destino=\{\{ correo: reenvio\.correo \}\} segundosIniciales=\{reenvio\.segundos\} \/>/);
  assert.match(verificacion, /<BotonReenviar destino=\{\{ token \}\} principal \/>/);
  assert.match(ingreso, /<BotonReenviar destino=\{\{ correo: correo\.trim\(\) \}\} conAyuda=\{false\} className="flex-1" \/>/);
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

test("02 (a) · al llegar desde 01b la cuenta atrás ya corre con lo que falta de los 60 s", () => {
  const enviado = Date.parse("2026-10-07T12:00:00.000Z");
  assert.equal(ESPERA_REENVIO_S, 60);
  assert.equal(segundosTrasEnvio(enviado, enviado), 60);
  assert.equal(segundosTrasEnvio(enviado, enviado + 18_000), 42);
  assert.equal(segundosTrasEnvio(enviado, enviado + 59_001), 1);
  assert.equal(segundosTrasEnvio(enviado, enviado + 60_000), 0);
  assert.equal(segundosTrasEnvio(null, enviado), 0, "sin hora guardada no se inventa la espera");
  assert.equal(segundosTrasEnvio(enviado + 5_000, enviado), 60, "un reloj adelantado no pasa de 60");
});

test("02 (a) · lo guardado por 01b trae el correo y la hora; el formato anterior (solo correo) sigue valiendo", () => {
  assert.deepEqual(correoPendienteDesde('{"correo":"derek@tiendademo.com","enviadoEn":1000}'), {
    correo: "derek@tiendademo.com",
    enviadoEn: 1000,
  });
  assert.deepEqual(correoPendienteDesde("derek@tiendademo.com"), { correo: "derek@tiendademo.com", enviadoEn: null });
  assert.equal(correoPendienteDesde(null), null);
  assert.equal(correoPendienteDesde('{"correo":""}'), null);
});

test("02 · el botón deshabilitado con la cuenta atrás, «Reenviar correo» principal en (c) y «Volver» como enlace", () => {
  const boton = leer("src/app/(auth)/verificar/boton-reenviar.tsx");
  const verificacion = leer("src/app/(auth)/verificar/verificacion.tsx");

  assert.match(boton, /useState\(segundosIniciales\)/);
  assert.match(boton, /disabled=\{enviando \|\| esperando\}/);
  assert.match(boton, /variant=\{principal \? "default" : "outline"\}/);
  assert.match(verificacion, /segundosTrasEnvio\(pendiente\.enviadoEn, Date\.now\(\)\)/);
  assert.match(verificacion, /<Link href="\/ingresar" className="text-foreground underline-offset-\[3px\] hover:underline">\s*Volver a iniciar sesión/);
});

test("03b · sin verificar: «Reenviar correo» junto a «Iniciar sesión» deshabilitado; al editar vuelve el formulario", () => {
  const ingreso = leer("src/app/(auth)/ingresar/formulario-ingreso.tsx");

  assert.match(ingreso, /<Button size="lg" className="flex-1" type="submit" disabled>\s*Iniciar sesión/);
  assert.match(ingreso, /if \(sinVerificar\) setAviso\(null\)/);
  assert.doesNotMatch(ingreso, /actions=\{<BotonReenviar/);
});
