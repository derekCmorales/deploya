import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { accesoDesdeRespuesta, nombreRol } from "../src/lib/acceso.ts";

const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), "utf8");

test("Administrador en ruta de administración: 200 de la API muestra la sección", () => {
  assert.equal(accesoDesdeRespuesta(200, ""), "permitido");
});

test("Cliente en ruta de administración: 403 SoloAdministracion muestra la pantalla 28", () => {
  assert.equal(accesoDesdeRespuesta(403, "SoloAdministracion"), "solo-administracion");
});

test("28 · 401 es sin sesión; otro 403 o un fallo de red es error, no 403 de rol", () => {
  assert.equal(accesoDesdeRespuesta(401, "SinSesion"), "sin-sesion");
  assert.equal(accesoDesdeRespuesta(403, "OtraCosa"), "error");
  assert.equal(accesoDesdeRespuesta(0, "sin-conexion"), "error");
  assert.equal(accesoDesdeRespuesta(500, "http-500"), "error");
});

test("28 · el rol de la sesión se muestra con su nombre visible", () => {
  assert.equal(nombreRol("cliente"), "Cliente");
  assert.equal(nombreRol("administrador"), "Administrador");
  assert.equal(nombreRol(undefined), "Cliente");
});

test("28 · el 403 lleva el texto exacto de la ficha y es un componente reutilizable", () => {
  const sinPermisos = leer("src/components/estados/sin-permisos.tsx");

  assert.match(sinPermisos, /export function SinPermisos/);
  assert.match(sinPermisos, />Esta sección es solo para administración</);
  assert.match(sinPermisos, /Tu cuenta es de tipo <span className="font-medium text-foreground">\{rol\}<\/span>/);
  assert.match(sinPermisos, /Si crees que es un error, escribe a/);
  assert.match(sinPermisos, /soporte@deploya\.app/);
});

test("28 · el 403 ofrece «Ir a proyectos» como acción principal", () => {
  const sinPermisos = leer("src/components/estados/sin-permisos.tsx");

  assert.match(sinPermisos, /<Button asChild size="sm">\s*<Link href="\/projects">Ir a proyectos<\/Link>/);
});

test("/admin exige sesión y pregunta a la API antes de mostrarse", () => {
  const layout = leer("src/app/(admin)/layout.tsx");
  const guard = leer("src/app/(admin)/acceso-administracion.tsx");

  assert.match(layout, /<RequiereSesion>\s*<AccesoAdministracionGuard>/);
  assert.match(guard, /consultarAccesoAdministracion\(\)/);
  assert.match(guard, /<SinPermisos/);
  assert.match(leer("src/lib/api-administracion.ts"), /pedirApi\("\/administracion\/acceso"\)/);
});

test("28 · el 403 y la sección de administración no hacen fetch, no usan colores de Tailwind ni any", () => {
  for (const ruta of [
    "src/components/estados/sin-permisos.tsx",
    "src/app/(admin)/layout.tsx",
    "src/app/(admin)/acceso-administracion.tsx",
    "src/app/(admin)/admin/page.tsx",
  ]) {
    const codigo = leer(ruta);
    assert.doesNotMatch(codigo, /\bfetch\(/, `fetch en ${ruta}`);
    assert.doesNotMatch(codigo, /\b(?:bg|text|border)-(?:red|green|emerald|blue|yellow|amber|slate|gray)-\d/, `color de Tailwind en ${ruta}`);
    assert.doesNotMatch(codigo, /#[0-9a-fA-F]{3,8}\b/, `hex en ${ruta}`);
    assert.doesNotMatch(codigo, /:\s*any\b|<any>/, `any en ${ruta}`);
  }
});
