import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  ErrorCatalogo,
  obtenerPlanes,
  COMPLEMENTOS_DATOS,
  INCLUIDO_EN_TODOS,
  RECURSOS,
  recursosDelCatalogo,
  textoBasesIncluidas,
  textoEquivalencia,
  textoCpu,
  textoGb,
  textoMemoria,
  textoMiles,
  textoPeriodo,
  textoPrecio,
  valorRecurso,
} from "../src/lib/planes.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const leer = (p) => readFileSync(join(root, p), "utf8");

const SANDBOX = {
  codigo: "sandbox",
  nombre: "Sandbox",
  descripcion: "Para probar deploya con un proyecto.",
  precio30: 0,
  precio365: null,
  maxProyectos: 1,
  cpus: 0.25,
  memoriaMb: 256,
  construccionesMes: 30,
};
const PRO = { ...SANDBOX, codigo: "pro", nombre: "Pro", precio30: 19, precio365: 190, maxProyectos: 10, cpus: 1, memoriaMb: 1024, construccionesMes: 500 };

test("precio de 30 y 365 días; Sandbox sin costo y sin periodo", () => {
  assert.equal(textoPrecio(PRO, "30"), "USD 19.00");
  assert.equal(textoPrecio(PRO, "365"), "USD 190.00");
  assert.equal(textoPeriodo(PRO, "30"), "/ 30 días");
  assert.equal(textoPeriodo(PRO, "365"), "/ 365 días");
  assert.equal(textoPrecio(SANDBOX, "365"), "Sin costo");
  assert.equal(textoPeriodo(SANDBOX, "30"), null);
});

test("recursos con el formato de la ficha 06", () => {
  assert.deepEqual([0.25, 0.5, 1, 2].map(textoCpu), ["0.25 vCPU", "0.5 vCPU", "1 vCPU", "2 vCPU"]);
  assert.deepEqual([256, 512, 1024, 2048].map(textoMemoria), ["256 MB", "512 MB", "1 GB", "2 GB"]);
  assert.deepEqual([1, 25, 500, 2000].map(textoMiles), ["1", "25", "500", "2 000"]);
  assert.deepEqual(
    RECURSOS.map((r) => r.etiqueta),
    ["Proyectos", "CPU por proyecto", "Memoria por proyecto", "Construcciones / mes"],
  );
});

test("obtenerPlanes lee GET /suscripciones/planes de la API", async () => {
  const pedidas = [];
  const pedir = async (url) => {
    pedidas.push(url);
    return new Response(JSON.stringify([SANDBOX, PRO]), { status: 200 });
  };
  const planes = await obtenerPlanes("http://api.test", pedir);
  assert.deepEqual(pedidas, ["http://api.test/suscripciones/planes"]);
  assert.deepEqual(planes.map((p) => p.codigo), ["sandbox", "pro"]);
});

test("obtenerPlanes lanza ErrorCatalogo con el estado HTTP", async () => {
  const pedir = async () => new Response("", { status: 503 });
  await assert.rejects(obtenerPlanes("http://api.test", pedir), (error) => error instanceof ErrorCatalogo && error.estado === 503);
});

test("/planes existe, no trae planes en constantes y el stub /billing se borró", () => {
  assert.ok(existsSync(join(root, "src/app/(billing)/planes/page.tsx")));
  assert.ok(!existsSync(join(root, "src/app/(billing)/billing/page.tsx")));
  const tabla = leer("src/app/(billing)/planes/_componentes/tabla-planes.tsx");
  assert.doesNotMatch(tabla, /USD 5\.00|Starter|Business/);
  assert.match(leer("src/hooks/use-planes.ts"), /obtenerPlanes/);
  assert.match(leer("src/components/shell/nav-panel.tsx"), /RUTA_PLANES = "\/planes"/);
});

test("los textos fijos de la ficha 06 están en la pantalla", () => {
  const pantalla = [
    "src/app/(billing)/_componentes/cabecera-cobro.tsx",
    "src/app/(billing)/planes/_componentes/cabecera-planes.tsx",
    "src/app/(billing)/planes/_componentes/tabla-planes.tsx",
  ]
    .map(leer)
    .join("\n");
  for (const texto of [
    "Cobro · Planes",
    "Tarifa de lanzamiento en USD. Por 365 días pagas 10 meses: dos gratis. Nada se renueva sin tu permiso.",
    "Mi suscripción",
    "Historial de pagos",
    "§4.2 · Recursos",
    "Lo que el contenedor de cada proyecto recibe. Se aplica con los límites de Docker.",
    "Plan actual",
    "Contratar",
    "Todos los proyectos corren en un único servidor (VPS) y se publican en un subdominio",
    "*.{DOMINIO_APPS}",
    "Bases incluidas",
    "Datos aparte",
  ]) {
    assert.ok(pantalla.includes(texto), `falta «${texto}»`);
  }
});

test("06 · filas de datos solo si el catálogo trae maxRecursosDatos y discoDatosMb", () => {
  assert.deepEqual(recursosDelCatalogo([SANDBOX, PRO]).map((r) => r.etiqueta), RECURSOS.map((r) => r.etiqueta));
  const conDatos = [
    { ...SANDBOX, maxRecursosDatos: 1, discoDatosMb: 512 },
    { ...PRO, maxRecursosDatos: 10, discoDatosMb: 10240 },
  ];
  const filas = recursosDelCatalogo(conDatos);
  assert.deepEqual(filas.slice(-2).map((r) => r.etiqueta), ["Recursos de datos", "Disco por base"]);
  assert.deepEqual(conDatos.map((plan) => valorRecurso(plan, filas.at(-1))), ["0.5 GB", "10 GB"]);
  assert.deepEqual(conDatos.map((plan) => valorRecurso(plan, filas.at(-2))), ["1", "10"]);
});

test("06 · un plan sin el campo muestra «—» y el disco se lee en GB", () => {
  const filas = recursosDelCatalogo([{ ...PRO, maxRecursosDatos: 10 }, SANDBOX]);
  assert.equal(valorRecurso(SANDBOX, filas.at(-1)), "—");
  assert.deepEqual([512, 2048, 10240, 25600].map(textoGb), ["0.5 GB", "2 GB", "10 GB", "25 GB"]);
  assert.match(leer("src/app/(billing)/planes/_componentes/tabla-planes.tsx"), /recursosDelCatalogo\(planes\)/);
});

test("06 · equivalencia bajo el precio: año con 30 días, dos meses gratis con 365", () => {
  assert.equal(textoEquivalencia(PRO, "30"), "USD 190.00 por 365 días");
  assert.equal(textoEquivalencia(PRO, "365"), "Pagas 10 meses: dos gratis");
  assert.equal(textoEquivalencia(SANDBOX, "30"), "No vence · sin tarjeta");
  assert.equal(textoEquivalencia({ ...PRO, precio365: null }, "30"), "Solo por 30 días");
});

test("06 · bases incluidas por plan como la landing; código desconocido muestra «—»", () => {
  assert.deepEqual(
    ["sandbox", "starter", "pro", "business", "otro"].map((codigo) => textoBasesIncluidas({ codigo })),
    ["Ninguna: trae tu propia URL", "Aparte, desde USD 2", "PostgreSQL + Redis", "PostgreSQL + Redis + S3", "—"],
  );
  assert.equal(INCLUIDO_EN_TODOS.length, 3);
  assert.deepEqual(COMPLEMENTOS_DATOS.map((c) => c.precio30), [5, 2, 4, 2]);
});

test("06 · sin recursos de datos el disco por base muestra «—»", () => {
  const filas = recursosDelCatalogo([{ ...SANDBOX, maxRecursosDatos: 0, discoDatosMb: 512 }]);
  assert.equal(valorRecurso({ ...SANDBOX, maxRecursosDatos: 0, discoDatosMb: 512 }, filas.at(-1)), "—");
  assert.equal(valorRecurso({ ...SANDBOX, maxRecursosDatos: 0, discoDatosMb: 512 }, filas.at(-2)), "0");
});
