import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { DIAS_GRACIA, finDeGracia, textoVencida } from "../src/lib/suscripcion.ts";
import { detalleReintento, esFalloDeConexion, esperaDeReintento } from "../src/lib/reintento.ts";

const leer = (ruta) => readFileSync(new URL(`../${ruta}`, import.meta.url), "utf8");

const STARTER_VENCIDA = {
  plan: { codigo: "starter", nombre: "Starter" },
  estado: "vencida",
  vence: "2026-09-24T12:00:00.000Z",
  estadoDesde: "2026-09-24T12:00:00.000Z",
};

const PANTALLAS = [
  "src/app/not-found.tsx",
  "src/components/estados/pagina-inexistente.tsx",
  "src/components/estados/error-conexion-api.tsx",
  "src/components/estados/esqueleto-proyectos.tsx",
  "src/app/(projects)/projects/_componentes/panel-proyectos.tsx",
];

test("Aviso con la fecha de gracia: Starter vencida el 24 sep sigue en línea hasta el 29 sep", () => {
  assert.equal(DIAS_GRACIA, 5);
  assert.equal(finDeGracia(STARTER_VENCIDA.vence), "2026-09-29T12:00:00.000Z");
  assert.deepEqual(textoVencida(STARTER_VENCIDA), {
    titulo: "Tu plan Starter venció el 24 sep · despliegues bloqueados",
    texto: "Tus servicios siguen en línea hasta el 29 sep (5 días de gracia). No puedes desplegar ni crear proyectos hasta renovar.",
  });
});

test("sin `vence`, la gracia se cuenta desde que entró en Vencida", () => {
  const aviso = textoVencida({ ...STARTER_VENCIDA, vence: null, estadoDesde: "2026-10-01T00:00:00.000Z" });
  assert.match(aviso.titulo, /venció el 01 oct/);
  assert.match(aviso.texto, /hasta el 06 oct/);
});

test("Suscripción vencida: la lista avisa (10c) con «Ver suscripción» y «Renovar», y solo en Vencida", () => {
  const panel = leer("src/app/(projects)/projects/_componentes/panel-proyectos.tsx");
  assert.match(panel, /suscripcion\?\.estado === "vencida" \? <AvisoVencida/, "Activa, Por vencer o sin datos: sin banner");
  assert.match(panel, /variant="warn"/);
  assert.match(panel, />Ver suscripción</);
  assert.match(panel, /rutaRenovar\(suscripcion\)\}>Renovar</);
});

test("Suscripción vencida: «Nuevo proyecto» y «Desplegar» quedan deshabilitados", () => {
  const lista = leer("src/app/(projects)/projects/_componentes/lista-proyectos.tsx");
  const marco = leer("src/app/(projects)/projects/_componentes/marco-proyecto.tsx");
  const boton = leer("src/app/(projects)/projects/_componentes/boton-desplegar.tsx");

  assert.match(lista, /bloqueada \|\| !puedeCrearProyecto\(lista\)/);
  assert.match(marco, /<BotonDesplegar proyectoId=\{proyecto\.id\} bloqueado=\{bloqueada\} \/>/);
  assert.match(boton, /disabled=\{ocupado \|\| bloqueado\}/);
});

test("Error de conexión con la API: reintenta solo a los 8 s, luego 16 s y 30 s", () => {
  assert.deepEqual([0, 1, 2, 3, 9].map(esperaDeReintento), [8, 16, 30, 30, 30]);
  assert.equal(detalleReintento("/proyectos", "sin-conexion", 8), "GET /proyectos · sin-conexion · reintento en 8 s");
});

test("Error de conexión con la API: solo sin conexión o con 5xx; un 4xx no se reintenta", () => {
  assert.equal(esFalloDeConexion(0), true);
  assert.equal(esFalloDeConexion(503), true);
  assert.equal(esFalloDeConexion(401), false);
  assert.equal(esFalloDeConexion(404), false);
});

test("Error de conexión con la API: textos de 28, «Reintentar ahora» y se usa en la lista y en el proyecto", () => {
  const error = leer("src/components/estados/error-conexion-api.tsx");
  for (const texto of [
    "No pudimos conectar con deploya",
    "Tus servicios siguen en línea; lo que falla es la conexión del panel. Reintentamos solos.",
    "Reintentar ahora",
  ]) {
    assert.ok(error.includes(texto), `falta «${texto}»`);
  }
  assert.match(error, /clearInterval\(reloj\)/, "deja de contar al desmontarse");
  assert.match(leer("src/app/(projects)/projects/_componentes/panel-proyectos.tsx"), /<ErrorConexionApi/);
  assert.match(leer("src/app/(projects)/projects/_componentes/marco-proyecto.tsx"), /<ErrorConexionApi/);
});

test("Página inexistente: «No encontramos esta página» con la ruta pedida e «Ir a proyectos»", () => {
  const pagina = leer("src/components/estados/pagina-inexistente.tsx");
  assert.match(leer("src/app/not-found.tsx"), /<PaginaInexistente \/>/);
  assert.match(pagina, /No encontramos esta página/);
  assert.match(pagina, /La dirección <code[^>]*>\{ruta\}<\/code> no existe o se movió\./);
  assert.match(pagina, /href="\/projects"/);
  assert.match(pagina, /Ir a proyectos/);
  assert.match(pagina, /Volver/);
  assert.match(leer("src/app/(projects)/projects/_componentes/marco-proyecto.tsx"), /if \(datos && !proyecto\) notFound\(\);/);
});

test("Carga: la lista muestra EsqueletoProyectos mientras carga", () => {
  assert.match(leer("src/app/(projects)/projects/_componentes/panel-proyectos.tsx"), /cargando \? <EsqueletoProyectos \/>/);
});

test("28 · sin fetch, sin colores de Tailwind, sin hex ni any", () => {
  for (const ruta of PANTALLAS) {
    const codigo = leer(ruta);
    assert.doesNotMatch(codigo, /\bfetch\(/, `fetch en ${ruta}`);
    assert.doesNotMatch(codigo, /\b(?:bg|text|border)-(?:red|green|emerald|blue|yellow|amber|slate|gray)-\d/, `color de Tailwind en ${ruta}`);
    assert.doesNotMatch(codigo, /#[0-9a-fA-F]{3,8}\b/, `hex en ${ruta}`);
    assert.doesNotMatch(codigo, /:\s*any\b|<any>/, `any en ${ruta}`);
  }
});
