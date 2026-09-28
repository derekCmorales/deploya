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

test("02 · 200 es cuenta activada; TokenNoValido es enlace no válido; lo demás, error", () => {
  assert.equal(resultadoVerificacion(200, { estadoCuenta: "activa" }), "activada");
  assert.equal(resultadoVerificacion(410, { codigo: "TokenNoValido" }), "no-valido");
  assert.equal(resultadoVerificacion(503, {}), "error");
});
