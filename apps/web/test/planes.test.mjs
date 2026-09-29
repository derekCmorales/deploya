import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  ErrorCatalogo,
  obtenerPlanes,
  RECURSOS,
  textoCpu,
  textoMemoria,
  textoMiles,
  textoPeriodo,
  textoPrecio,
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
const PRO = { ...SANDBOX, codigo: "pro", nombre: "Pro", precio30: 15, precio365: 150, maxProyectos: 10, cpus: 1, memoriaMb: 1024, construccionesMes: 500 };

test("precio de 30 y 365 días; Sandbox sin costo y sin periodo", () => {
  assert.equal(textoPrecio(PRO, "30"), "USD 15.00");
  assert.equal(textoPrecio(PRO, "365"), "USD 150.00");
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
    "src/app/(billing)/planes/_componentes/cabecera-planes.tsx",
    "src/app/(billing)/planes/_componentes/tabla-planes.tsx",
  ]
    .map(leer)
    .join("\n");
  for (const texto of [
    "Cobro · Planes",
    "Precios en USD. Pagas por vigencia; nada se renueva sin tu permiso.",
    "Mi suscripción",
    "Historial de pagos",
    "§4.2 · Recursos",
    "Lo que el contenedor de cada proyecto recibe. Se aplica con los límites de Docker.",
    "Plan actual",
    "Contratar",
    "Todos los proyectos corren en un único servidor (VPS) y se publican en un subdominio",
    "*.deploya.app",
  ]) {
    assert.ok(pantalla.includes(texto), `falta «${texto}»`);
  }
});
