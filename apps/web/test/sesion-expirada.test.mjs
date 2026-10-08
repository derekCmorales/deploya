import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { destinoSinSesion, EVENTO_SIN_SESION, PARAMETRO_EXPIRADA } from "../src/lib/sesion-expirada.ts";

const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), "utf8");

test("Sesión expirada: si había usuario, lleva a /ingresar?expirada=1 y vuelve a la misma página", () => {
  assert.equal(destinoSinSesion(true, "/projects/nuevo"), "/ingresar?expirada=1&siguiente=%2Fprojects%2Fnuevo");
});

test("Ruta protegida sin sesión: si nunca hubo sesión, lleva a /ingresar sin el aviso", () => {
  assert.equal(destinoSinSesion(false, "/projects"), "/ingresar?siguiente=%2Fprojects");
});

test("28 · un 401 de la API avisa a SesionProvider, que vuelve a leer la sesión", () => {
  const api = leer("src/lib/api.ts");
  const sesion = leer("src/hooks/use-sesion.tsx");

  assert.match(api, /respuesta\.status === HTTP_NO_AUTENTICADO\) avisarSinSesion\(\)/);
  assert.match(api, /new Event\(EVENTO_SIN_SESION\)/);
  assert.match(sesion, /addEventListener\(EVENTO_SIN_SESION/);
  assert.match(sesion, /else if \(habiaUsuario\.current\) setExpirada\(true\)/);
  assert.equal(EVENTO_SIN_SESION, "deploya:sin-sesion");
});

test("28 · «Salir» no cuenta como sesión expirada", () => {
  const sesion = leer("src/hooks/use-sesion.tsx");
  const inicio = sesion.indexOf("const salir");
  const salir = sesion.slice(inicio, sesion.indexOf("useEffect(", inicio));

  assert.match(salir, /habiaUsuario\.current = false/);
  assert.match(salir, /setExpirada\(false\)/);
});

test("28 · /ingresar?expirada=1 muestra el aviso con el texto exacto de la ficha", () => {
  const aviso = leer("src/app/(auth)/ingresar/aviso-sesion-expirada.tsx");

  assert.equal(PARAMETRO_EXPIRADA, "expirada");
  assert.match(aviso, /title="Tu sesión expiró"/);
  assert.match(aviso, /Por seguridad cerramos las sesiones tras 7 días sin actividad\. Inicia sesión de nuevo y volverás a esta página\./);
  assert.match(leer("src/components/shell/requiere-sesion.tsx"), /destinoSinSesion\(expirada, ruta\)/);
});

test("28 · Sesión expirada: diálogo sobre el panel con «Iniciar sesión»; sin sesión previa se redirige directo", () => {
  const guard = leer("src/components/shell/requiere-sesion.tsx");

  assert.match(guard, /if \(estado === "sin-sesion" && !expirada\) router\.replace\(destino\)/);
  assert.match(guard, /<SesionExpirada destino=\{destino\}/);
  assert.match(guard, /<Dialog\s+open/);
  assert.match(guard, /Tu sesión expiró/);
  assert.match(guard, /Por seguridad cerramos las sesiones tras 7 días sin actividad\. Inicia sesión de nuevo y volverás a esta página\./);
  assert.match(guard, /<Link href=\{destino\} ref=\{accion\}>[\s\S]*Iniciar sesión/);
});

test("28 · el diálogo de sesión expirada enfoca «Iniciar sesión» y cerrarlo también lleva a /ingresar", () => {
  const guard = leer("src/components/shell/requiere-sesion.tsx");

  assert.match(guard, /useEffect\(\(\) => accion\.current\?\.focus\(\), \[\]\)/);
  assert.match(guard, /alCerrar=\{\(\) => router\.replace\(destino\)\}/);
});
