import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { destinoTrasIngreso, erroresRegistro, resultadoIngreso, resultadoRegistro, resultadoVerificacion } from "../src/lib/cuenta.ts";

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

test("01–02 · las pantallas de acceso usan el header público (Planes · tema · Iniciar sesión) sin la navegación del panel", () => {
  const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), "utf8");
  const marco = leer("src/components/shell/marco-app.tsx");
  const [publico, panel] = marco.split("<AppShell nav=");
  assert.match(leer("src/app/layout.tsx"), /<MarcoApp>/);
  assert.match(leer("src/app/layout.tsx"), /<SesionProvider>/);
  assert.match(marco, /GRUPO_ACCESO = "\(auth\)"/);
  assert.match(publico, />Planes</);
  assert.match(publico, />Iniciar sesión</);
  assert.doesNotMatch(publico, /NavPanel \/>/);
  assert.match(panel, /NavPanel/);
  assert.match(panel, /<MenuUsuario \/>/);
});

test("03 · /ingresar existe y el grupo (projects) exige sesión", () => {
  assert.ok(existsSync(new URL("../src/app/(auth)/ingresar/page.tsx", import.meta.url)));
  assert.match(readFileSync(new URL("../src/app/(projects)/layout.tsx", import.meta.url), "utf8"), /<RequiereSesion>/);
});

test("03 · 200 de la API es sesión iniciada", () => {
  assert.deepEqual(resultadoIngreso(200, { usuario: {} }), { tipo: "dentro" });
});

test("03b · credenciales incorrectas, cuenta sin verificar y suspendida", () => {
  assert.deepEqual(resultadoIngreso(401, { codigo: "CredencialesInvalidas" }), { tipo: "credenciales" });
  assert.deepEqual(resultadoIngreso(403, { codigo: "CuentaNoVerificada", correoEnmascarado: "d•••k@t•••••••o.com" }), {
    tipo: "sin-verificar",
    correoEnmascarado: "d•••k@t•••••••o.com",
  });
  assert.deepEqual(resultadoIngreso(403, { codigo: "CuentaSuspendida" }), { tipo: "suspendida" });
  assert.equal(resultadoIngreso(0, {}).tipo, "error");
});

test("03 · tras iniciar sesión vuelve solo a rutas propias", () => {
  assert.equal(destinoTrasIngreso("/projects/nuevo"), "/projects/nuevo");
  assert.equal(destinoTrasIngreso(null), "/projects");
  assert.equal(destinoTrasIngreso("//evil.com"), "/projects");
  assert.equal(destinoTrasIngreso("https://evil.com"), "/projects");
  assert.equal(destinoTrasIngreso("/\\evil.com"), "/projects");
});

/** Guardia de diseño de una ilustración de acceso: la página la monta, es decorativa y no trae hex. */
async function revisarIlustracion(pagina, componente, nombre) {
  const { readFileSync } = await import("node:fs");
  const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), "utf8");
  const ilustracion = leer(componente);
  assert.match(leer(pagina), new RegExp(`<${nombre}`));
  assert.match(ilustracion, /aria-hidden="true"/);
  assert.doesNotMatch(ilustracion, /#[0-9a-fA-F]{3,8}\b/);
}

test("01 · la columna derecha lleva la ilustración de acceso, decorativa y sin hex", async () => {
  await revisarIlustracion(
    "src/app/(auth)/registro/page.tsx",
    "src/app/(auth)/registro/ilustracion-registro.tsx",
    "IlustracionRegistro",
  );
});

test("03 · la columna derecha lleva la ilustración de acceso, decorativa y sin hex", async () => {
  await revisarIlustracion(
    "src/app/(auth)/ingresar/page.tsx",
    "src/app/(auth)/ingresar/ilustracion-ingreso.tsx",
    "IlustracionIngreso",
  );
});

test("design system · toda utilidad de movimiento dy-* se apaga con movimiento reducido", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  const conMovimiento = [...css.matchAll(/\.(dy-[a-z-]+)\s*\{[^}]*animation:/g)].map((m) => m[1]);
  const reducido = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/)[1];

  assert.ok(conMovimiento.includes("dy-flota"));
  assert.ok(conMovimiento.includes("dy-giro-lento"));
  assert.deepEqual(conMovimiento.filter((clase) => !reducido.includes(`.${clase}`)), []);
});
