import assert from "node:assert/strict";
import test from "node:test";

import { erroresRegistro, resultadoRegistro, resultadoVerificacion } from "../src/lib/cuenta.ts";

const VALIDOS = { correo: "derek@tiendademo.com", contrasena: "Deploya#2026seguro", confirmacion: "Deploya#2026seguro" };

test("01 · un registro completo no tiene errores", () => {
  assert.deepEqual(erroresRegistro(VALIDOS, true), {});
});

test("01 · marca correo inválido, contraseña que no cumple y confirmación distinta", () => {
  const errores = erroresRegistro({ correo: "derek@", contrasena: "corta", confirmacion: "otra" }, false);
  assert.deepEqual(Object.keys(errores).sort(), ["confirmacion", "contrasena", "correo"]);
});

test("01b · 201 de la API muestra «Cuenta creada» con el correo enmascarado", () => {
  assert.deepEqual(resultadoRegistro(201, { correoEnmascarado: "d•••k@t•••••••o.com", correoEnviado: true }), {
    tipo: "creada",
    correoEnmascarado: "d•••k@t•••••••o.com",
    correoEnviado: true,
  });
});

test("01b · CorreoYaRegistrado muestra el estado «correo ya registrado»", () => {
  assert.deepEqual(resultadoRegistro(409, { codigo: "CorreoYaRegistrado" }), { tipo: "correo-registrado" });
});

test("01 · un fallo de red o 500 muestra un mensaje genérico", () => {
  assert.equal(resultadoRegistro(0, {}).tipo, "error");
  assert.equal(resultadoRegistro(500, { mensaje: "Internal server error" }).mensaje.startsWith("No pudimos"), true);
});

test("02 · un 200 con la cuenta suspendida no se muestra como activada", () => {
  assert.equal(resultadoVerificacion(200, { estadoCuenta: "suspendida" }), "no-activada");
});

test("02 · 200 activa es cuenta activada; TokenNoValido es enlace no válido; lo demás, error", () => {
  assert.equal(resultadoVerificacion(200, { estadoCuenta: "activa" }), "activada");
  assert.equal(resultadoVerificacion(410, { codigo: "TokenNoValido" }), "no-valido");
  assert.equal(resultadoVerificacion(503, {}), "error");
});

test("01–02 · las pantallas de acceso usan el header público (Planes · tema · Iniciar sesión) sin la navegación del panel", async () => {
  const { readFileSync } = await import("node:fs");
  const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), "utf8");
  const marco = leer("src/components/shell/marco-app.tsx");
  const [publico, panel] = marco.split("return <AppShell nav=");
  assert.match(leer("src/app/layout.tsx"), /<MarcoApp>/);
  assert.match(marco, /GRUPO_ACCESO = "\(auth\)"/);
  assert.match(publico, />Planes</);
  assert.match(publico, />Iniciar sesión</);
  assert.doesNotMatch(publico, /NavPanel \/>/);
  assert.match(panel, /NavPanel/);
});

test("01 · la columna derecha lleva la ilustración de acceso hecha solo con tokens (sin hex)", async () => {
  const { readFileSync } = await import("node:fs");
  const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), "utf8");
  const ilustracion = leer("src/app/(auth)/registro/ilustracion-registro.tsx");
  assert.match(leer("src/app/(auth)/registro/page.tsx"), /<IlustracionRegistro/);
  assert.match(ilustracion, /aria-hidden/);
  assert.match(ilustracion, /fill-signal/);
  assert.doesNotMatch(ilustracion, /#[0-9a-fA-F]{3,8}\b/);
});
