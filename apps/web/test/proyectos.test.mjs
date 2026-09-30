import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  algunoEnCurso,
  confirmacionCoincide,
  contadorProyectos,
  despliegueEnCurso,
  duracionEtapa,
  errorDeAlta,
  etapasDelRiel,
  filtrarProyectos,
  haceCuanto,
  nombreSugerido,
  puedeCrearProyecto,
  puertoValido,
  recursosPlan,
  repositorioCorto,
  resumenDockerfile,
  subdominioDesdeNombre,
  subtituloProyectos,
  urlProyecto,
} from "../src/lib/proyectos.ts";

const SANDBOX = { nombre: "Sandbox", cpus: 0.25, memoriaMb: 256 };
const conUltimo = (estado) => ({ ultimoDespliegue: estado ? { estado } : null });

test("10 · ¿sigue en curso? según el estado del despliegue", () => {
  for (const e of ["encolado", "construyendo", "aprovisionando", "publicando"]) assert.equal(despliegueEnCurso(e), true, e);
  for (const e of ["saludable", "fallido", "cancelado", "detenido"]) assert.equal(despliegueEnCurso(e), false, e);
});

test("10 · Sondeo mientras hay algo en curso: la lista sigue mientras algún último despliegue no termine", () => {
  assert.equal(algunoEnCurso({ proyectos: [conUltimo("saludable"), conUltimo("construyendo")] }), true);
  assert.equal(algunoEnCurso({ proyectos: [conUltimo("saludable"), conUltimo(null)] }), false);
  assert.equal(algunoEnCurso({ proyectos: [] }), false);
});

test("10 · contador frente al plan y bloqueo de «Nuevo proyecto» en Sandbox con 1 proyecto", () => {
  assert.equal(contadorProyectos({ usados: 0, maximo: 1, plan: SANDBOX }), "0 de 1 proyecto en Sandbox");
  assert.equal(contadorProyectos({ usados: 2, maximo: 3, plan: { ...SANDBOX, nombre: "Starter" } }), "2 de 3 proyectos en Starter");
  assert.equal(puedeCrearProyecto({ usados: 0, maximo: 1 }), true);
  assert.equal(puedeCrearProyecto({ usados: 1, maximo: 1 }), false);
});

test("10b · sin proyectos el subtítulo cuenta el plan; con proyectos dice un contenedor por proyecto", () => {
  assert.equal(subtituloProyectos({ proyectos: [], usados: 0, maximo: 1, plan: SANDBOX }), "Plan Sandbox · 0 de 1 proyecto");
  assert.equal(
    subtituloProyectos({ proyectos: [{}], usados: 1, maximo: 3, plan: { ...SANDBOX, nombre: "Starter" } }),
    "Plan Starter · un contenedor por proyecto",
  );
});

test("10 · búsqueda por nombre sin distinguir mayúsculas ni acentos", () => {
  const proyectos = [
    { nombre: "API Tienda", subdominio: "api-tienda" },
    { nombre: "Panel admin", subdominio: "panel-admin" },
  ];
  assert.deepEqual(filtrarProyectos(proyectos, "tiénda").map((p) => p.nombre), ["API Tienda"]);
  assert.equal(filtrarProyectos(proyectos, "  ").length, 2);
});

test("10 · riel y duraciones de etapa", () => {
  assert.deepEqual(etapasDelRiel(null), ["pendiente", "pendiente", "pendiente", "pendiente", "pendiente"]);
  assert.deepEqual(etapasDelRiel({ etapas: [{ estado: "completada" }, { estado: "en-curso" }] }), ["completada", "en-curso"]);
  assert.equal(duracionEtapa(null), "—");
  assert.equal(duracionEtapa(1400), "1.4 s");
  assert.equal(duracionEtapa(70_000), "01:10");
});

test("10 · tiempo relativo del último despliegue", () => {
  const ahora = new Date("2026-09-30T12:00:00Z");
  assert.equal(haceCuanto("2026-09-30T11:59:30Z", ahora), "hace segundos");
  assert.equal(haceCuanto("2026-09-30T11:58:00Z", ahora), "hace 2 min");
  assert.equal(haceCuanto("2026-09-30T09:00:00Z", ahora), "hace 3 h");
  assert.equal(haceCuanto("2026-09-29T11:00:00Z", ahora), "ayer");
  assert.equal(haceCuanto("2026-09-27T12:00:00Z", ahora), "hace 3 d");
});

test("11a · el subdominio se deriva del nombre con la misma regla que la API", () => {
  assert.equal(subdominioDesdeNombre("Mi App Web"), "mi-app-web");
  assert.equal(subdominioDesdeNombre("Café & Bar!"), "cafe-bar");
  assert.equal(subdominioDesdeNombre("---Hola___Mundo---"), "hola-mundo");
  assert.equal(subdominioDesdeNombre("!@#"), "");
  assert.equal(subdominioDesdeNombre("x".repeat(70)).length, 63);
});

test("11a · nombre sugerido, repositorio corto, URL del proyecto y recursos del plan", () => {
  assert.equal(nombreSugerido("https://github.com/derekCmorales/hola-deploya"), "hola-deploya");
  assert.equal(repositorioCorto("https://github.com/tienda-demo/api-tienda"), "tienda-demo/api-tienda");
  assert.equal(urlProyecto("hola-deploya", "localhost", "http"), "http://hola-deploya.localhost");
  assert.equal(recursosPlan(SANDBOX), "0.25 vCPU · 256 MB");
  assert.equal(recursosPlan({ cpus: 1, memoriaMb: 1024 }), "1 vCPU · 1 GB");
});

test("11a · resumen del Dockerfile encontrado", () => {
  assert.equal(
    resumenDockerfile("FROM node:20-alpine\nWORKDIR /app\nEXPOSE 8080\nCMD [\"npm\", \"start\"]"),
    "/Dockerfile · FROM node:20-alpine · EXPOSE 8080",
  );
  assert.equal(resumenDockerfile("FROM nginx"), "/Dockerfile · FROM nginx");
});

test("11a · puerto válido entre 1 y 65535", () => {
  for (const p of ["1", "8080", "65535"]) assert.equal(puertoValido(p), true, p);
  for (const p of ["0", "65536", "80.5", "abc", ""]) assert.equal(puertoValido(p), false, p);
});

test("11e · cada código de la API se pinta donde dice el diseño", () => {
  assert.deepEqual(errorDeAlta("repositorio-no-accesible", "x", { estadoHttp: 404 }), { tipo: "no-accesible", estadoHttp: 404 });
  assert.deepEqual(errorDeAlta("sin-dockerfile", "x", { rama: "main" }), { tipo: "sin-dockerfile", rama: "main" });
  assert.deepEqual(errorDeAlta("url-invalida", "URL mala", {}), { tipo: "campo", campo: "url", mensaje: "URL mala" });
  assert.deepEqual(errorDeAlta("rama-no-encontrada", "sin rama", {}), { tipo: "campo", campo: "rama", mensaje: "sin rama" });
  assert.deepEqual(errorDeAlta("subdominio-en-uso", "ocupado", {}), { tipo: "campo", campo: "nombre", mensaje: "ocupado" });
  assert.deepEqual(errorDeAlta("datos-invalidos", "El puerto debe…", {}), { tipo: "campo", campo: "puerto", mensaje: "El puerto debe…" });
  assert.deepEqual(errorDeAlta("limite-proyectos", "Tu plan permite 1 proyecto.", {}), { tipo: "aviso", mensaje: "Tu plan permite 1 proyecto." });
  assert.deepEqual(errorDeAlta("fuente-no-disponible", "GitHub no respondió.", {}), { tipo: "aviso", mensaje: "GitHub no respondió." });
});

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const archivos = (dir) =>
  readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? archivos(join(dir, n)) : [join(dir, n)]));

test("las pantallas de proyectos no hacen fetch, no usan colores de Tailwind ni any", () => {
  for (const f of archivos(join(raiz, "src/app/(projects)")).filter((p) => p.endsWith(".tsx"))) {
    const codigo = readFileSync(f, "utf8");
    assert.doesNotMatch(codigo, /\bfetch\(/, `fetch en ${f}`);
    assert.doesNotMatch(codigo, /\b(?:bg|text|border)-(?:red|green|emerald|blue|yellow|amber|slate|gray)-\d/, `color de Tailwind en ${f}`);
    assert.doesNotMatch(codigo, /:\s*any\b|<any>/, `any en ${f}`);
  }
});

test("19b · eliminar solo se habilita con el nombre exacto del proyecto", () => {
  assert.equal(confirmacionCoincide("api-tienda", "api-tienda"), true);
  assert.equal(confirmacionCoincide("api-tienda", "  api-tienda "), true);
  assert.equal(confirmacionCoincide("api-tienda", "API-tienda"), false);
  assert.equal(confirmacionCoincide("api-tienda", ""), false);
});
