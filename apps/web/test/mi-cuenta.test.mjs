import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { errorNombre, erroresContrasena, nombreDeRol, resultadoCambioContrasena } from "../src/lib/mi-cuenta.ts";

const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), "utf8");

const PANTALLAS = [
  "src/app/(cuenta)/layout.tsx",
  "src/app/(cuenta)/cuenta/page.tsx",
  "src/app/(cuenta)/cuenta/seguridad/page.tsx",
  "src/app/(cuenta)/cuenta/_componentes/cabecera-cuenta.tsx",
  "src/app/(cuenta)/cuenta/_componentes/fila-cuenta.tsx",
  "src/app/(cuenta)/cuenta/_componentes/perfil.tsx",
  "src/app/(cuenta)/cuenta/_componentes/seguridad.tsx",
];

test("Editar nombre: se valida el nombre recortado, de 1 a 64 caracteres", () => {
  assert.equal(errorNombre("  Derek Calderón  "), undefined);
  assert.equal(errorNombre("a".repeat(64)), undefined);
});

test("Nombre vacío o de más de 64 caracteres: el cliente lo rechaza antes de llamar a la API", () => {
  assert.equal(errorNombre("   "), "Escribe tu nombre.");
  assert.equal(errorNombre("a".repeat(65)), "Máximo 64 caracteres.");
});

test("05b · «Confirmar» distinto de «Nueva contraseña» bloquea el envío", () => {
  const datos = { actual: "Vieja#Clave2026", nueva: "Nueva#Clave2026", confirmacion: "Otra#Clave2026" };
  assert.deepEqual(Object.keys(erroresContrasena(datos, true)), ["confirmacion"]);
});

test("05b · sin la actual o con una nueva débil también se bloquea; todo bien, sin errores", () => {
  assert.deepEqual(Object.keys(erroresContrasena({ actual: "", nueva: "corta", confirmacion: "corta" }, false)).sort(), ["actual", "nueva"]);
  assert.deepEqual(erroresContrasena({ actual: "Vieja#Clave2026", nueva: "Nueva#Clave2026", confirmacion: "Nueva#Clave2026" }, true), {});
});

test("Cambiar contraseña: 204 es cambiada; ContrasenaActualIncorrecta va al campo «Contraseña actual»", () => {
  assert.deepEqual(resultadoCambioContrasena(204, "", ""), { tipo: "cambiada" });
  assert.deepEqual(resultadoCambioContrasena(400, "ContrasenaActualIncorrecta", "x"), { tipo: "actual-incorrecta" });
  assert.deepEqual(resultadoCambioContrasena(400, "ContrasenaDebil", "La contraseña no cumple: largo"), {
    tipo: "error",
    mensaje: "La contraseña no cumple: largo",
  });
  assert.equal(resultadoCambioContrasena(0, "sin-conexion", "x").mensaje.startsWith("No pudimos cambiar"), true);
});

test("Ver mi cuenta: el rol se muestra con su nombre", () => {
  assert.equal(nombreDeRol("cliente"), "Cliente");
  assert.equal(nombreDeRol("administrador"), "Administrador");
});

test("05 y 05b · textos de las fichas y pestañas Perfil · Seguridad", () => {
  const cabecera = leer("src/app/(cuenta)/cuenta/_componentes/cabecera-cuenta.tsx");
  const perfil = leer("src/app/(cuenta)/cuenta/_componentes/perfil.tsx");
  const seguridad = leer("src/app/(cuenta)/cuenta/_componentes/seguridad.tsx");

  assert.match(cabecera, /<TabsNav aria-label="Secciones de la cuenta">/);
  assert.match(cabecera, />\s*Perfil\s*</);
  assert.match(cabecera, />\s*Seguridad\s*</);
  for (const texto of [
    "El nombre con el que aparece tu cuenta.",
    "Iniciales generadas a partir del nombre",
    "Es tu usuario para iniciar sesión. Por ahora no se puede cambiar.",
    "Cliente o Administrador. Lo asigna administración.",
  ]) {
    assert.ok(perfil.includes(texto), `falta «${texto}» en 05`);
  }
  for (const texto of [
    "Al cambiarla cerramos tus sesiones en otros dispositivos.",
    "Si perdiste un dispositivo o dejaste tu cuenta abierta en otro lado.",
    "Cerrar sesión en todos los dispositivos",
    "Invalida todas tus sesiones, incluida esta. Tendrás que volver a iniciar sesión.",
    "Repite la nueva",
  ]) {
    assert.ok(seguridad.includes(texto), `falta «${texto}» en 05b`);
  }
  assert.doesNotMatch(seguridad, /Último cambio:/, "«Último cambio» no se muestra (design.md, decisión 5)");
});

test("Mi cuenta exige sesión, va con el panel y «Cuenta» del menú lleva a /cuenta", () => {
  assert.match(leer("src/app/(cuenta)/layout.tsx"), /<RequiereSesion>/);
  assert.match(leer("src/components/shell/nav-panel.tsx"), /\{ href: "\/cuenta", texto: "Cuenta"/);
  assert.match(leer("src/app/(cuenta)/cuenta/_componentes/perfil.tsx"), /await recargar\(\)/, "el encabezado muestra el nombre nuevo");
});

test("05 y 05b · sin fetch, sin colores de Tailwind, sin hex ni any", () => {
  for (const ruta of PANTALLAS) {
    const codigo = leer(ruta);
    assert.doesNotMatch(codigo, /\bfetch\(/, `fetch en ${ruta}`);
    assert.doesNotMatch(codigo, /\b(?:bg|text|border)-(?:red|green|emerald|blue|yellow|amber|slate|gray)-\d/, `color de Tailwind en ${ruta}`);
    assert.doesNotMatch(codigo, /#[0-9a-fA-F]{3,8}\b/, `hex en ${ruta}`);
    assert.doesNotMatch(codigo, /:\s*any\b|<any>/, `any en ${ruta}`);
  }
});
