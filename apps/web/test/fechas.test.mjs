import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { fechaCorta } from "../src/lib/fechas.ts";

test("03b · la fecha de la suspensión se muestra como «22 sep 2026»", () => {
  assert.equal(fechaCorta("2026-09-22T15:00:00.000Z", "America/Guatemala"), "22 sep 2026");
  assert.equal(fechaCorta("2026-01-05T15:00:00.000Z", "America/Guatemala"), "5 ene 2026");
  assert.equal(fechaCorta("2026-12-31T18:00:00.000Z", "America/Guatemala"), "31 dic 2026");
});

test("03b · la fecha respeta la zona: de madrugada en UTC todavía es el día anterior en Guatemala", () => {
  assert.equal(fechaCorta("2026-09-23T03:00:00.000Z", "America/Guatemala"), "22 sep 2026");
});

test("03b · una fecha inválida no se muestra", () => {
  assert.equal(fechaCorta("no-es-fecha"), null);
});

test("03b · la tarjeta de suspendida muestra «Motivo registrado» y la fecha solo si la API las trae", async () => {
  const { readFileSync } = await import("node:fs");
  const ingreso = readFileSync(new URL("../src/app/(auth)/ingresar/formulario-ingreso.tsx", import.meta.url), "utf8");

  assert.match(ingreso, /Motivo registrado/);
  assert.match(ingreso, /motivo=\{aviso\.motivo\} desde=\{aviso\.desde\}/);
  assert.match(ingreso, /fechaCorta\(desde\)/);
  assert.match(ingreso, /\{motivo \|\| fecha \? \(/, "la fecha se muestra aunque no conste el motivo");
});

test("03b · suspendida con la estructura del artboard: banner, motivo y «Escribir a soporte»", () => {
  const ingreso = readFileSync(new URL("../src/app/(auth)/ingresar/formulario-ingreso.tsx", import.meta.url), "utf8");
  const tarjeta = ingreso.slice(ingreso.indexOf("function CuentaSuspendida"));

  assert.match(tarjeta, />Iniciar sesión<\/h1>/);
  assert.match(tarjeta, /<Banner variant="bad" title="Cuenta suspendida por administración">/);
  assert.match(tarjeta, /No puedes iniciar sesión mientras dure la suspensión\. Tus proyectos y datos se conservan\./);
  assert.match(tarjeta, /<a href="mailto:soporte@deploya\.app">[\s\S]*Escribir a soporte/);
});
