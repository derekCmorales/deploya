import assert from "node:assert/strict";
import test from "node:test";

import {
  PASOS_ALTA,
  cuerpoAlta,
  errorComando,
  esUltimoPaso,
  motivoSinComandoConstruccion,
  pasoAnterior,
  pasoDeError,
  pasoSiguiente,
  pistaComandoConstruccion,
  textoProgreso,
} from "../src/lib/alta.ts";
import { alternarTipo, opcionesAlta, textoLimiteAlta, variablesInyectadasPor } from "../src/lib/datos.ts";
import { errorDeAlta } from "../src/lib/proyectos.ts";
import { clavesQueGanan, combinarVariables, contarClaves, filaNueva, parsearEnv, quitarFila, variablesDeBorrador } from "../src/lib/variables.ts";

const ENTRADA = {
  url: "https://github.com/u/app",
  rama: "main",
  rutaDockerfile: "Dockerfile",
  nombre: "app",
  puerto: "8080",
  comandoInicio: "",
  comandoConstruccion: "",
  aplicaComandoConstruccion: true,
  datos: [],
  variables: [],
};

test("el asistente tiene cinco pasos en orden y avanza de uno en uno", () => {
  assert.deepEqual(PASOS_ALTA, ["repositorio", "construccion", "datos", "variables", "revisar"]);
  assert.equal(pasoSiguiente("repositorio"), "construccion");
  assert.equal(pasoSiguiente("variables"), "revisar");
  assert.equal(pasoSiguiente("revisar"), "revisar");
  assert.equal(pasoAnterior("datos"), "construccion");
  assert.equal(pasoAnterior("repositorio"), "repositorio");
  assert.equal(esUltimoPaso("revisar"), true);
  assert.equal(textoProgreso("datos"), "Paso 3 de 5 · opcional");
  assert.equal(textoProgreso("revisar"), "Paso 5 de 5");
});

test("cada error del alta vuelve al paso donde se corrige", () => {
  assert.equal(pasoDeError(errorDeAlta("datos-no-permitidos", "Tu plan permite 1 base de datos", {})), "datos");
  assert.equal(pasoDeError(errorDeAlta("comando-invalido", "El comando de construcción va en una sola línea.", {})), "construccion");
  assert.equal(pasoDeError(errorDeAlta("comando-invalido", "El comando no se puede leer", {})), "construccion");
  assert.equal(pasoDeError(errorDeAlta("clave-invalida", "Usa MAYÚSCULAS", {})), "variables");
  assert.equal(pasoDeError(errorDeAlta("rama-no-encontrada", "No existe", { rama: "x" })), "repositorio");
  assert.equal(pasoDeError({ tipo: "aviso", mensaje: "Algo salió mal" }), "revisar");
});

test("comando-invalido se pinta bajo el campo correcto", () => {
  assert.deepEqual(errorDeAlta("comando-invalido", "El comando de construcción va en una sola línea.", {}), {
    tipo: "campo",
    campo: "comandoConstruccion",
    mensaje: "El comando de construcción va en una sola línea.",
  });
});

test("cuerpo del alta: el alta mínima no lleva campos nuevos", () => {
  assert.deepEqual(cuerpoAlta(ENTRADA), { url: ENTRADA.url, rama: "main", rutaDockerfile: "Dockerfile", nombre: "app", puerto: 8080, variables: [] });
});

test("cuerpo del alta: lleva comandos recortados y los datos elegidos", () => {
  const cuerpo = cuerpoAlta({ ...ENTRADA, comandoInicio: " node dist/worker.js ", comandoConstruccion: " npm run build:prod ", datos: ["postgres", "redis"] });
  assert.equal(cuerpo.comandoInicio, "node dist/worker.js");
  assert.equal(cuerpo.comandoConstruccion, "npm run build:prod");
  assert.deepEqual(cuerpo.datos, ["postgres", "redis"]);
});

test("Comando de construcción sin receta: no se ofrece, no se envía y el texto explica que el Dockerfile manda", () => {
  const cuerpo = cuerpoAlta({ ...ENTRADA, comandoConstruccion: "npm run x", aplicaComandoConstruccion: false });
  assert.equal("comandoConstruccion" in cuerpo, false);
  assert.match(motivoSinComandoConstruccion("dockerfile"), /Dockerfile manda/);
  assert.match(motivoSinComandoConstruccion("estatica"), /sitio estático/);
  assert.equal(pistaComandoConstruccion("dockerfile"), null);
  assert.match(pistaComandoConstruccion("node"), /npm run build/);
});

test("errorComando: largo, salto de línea y comilla abierta", () => {
  assert.equal(errorComando("npm run build", "construccion"), null);
  assert.match(errorComando("npm ci\nnpm run build", "construccion"), /una sola línea/);
  assert.match(errorComando('node "a', "inicio"), /comilla/);
  assert.match(errorComando("x".repeat(513), "inicio"), /512/);
});

test("Pegar un .env en el alta: dos variables nuevas, API_KEY sin comillas y el contador en 2", () => {
  const pegado = parsearEnv('NODE_ENV=production\nAPI_KEY="abc"');
  const filas = combinarVariables([filaNueva()], pegado.variables);
  assert.deepEqual(variablesDeBorrador(filas), [
    { clave: "NODE_ENV", valor: "production" },
    { clave: "API_KEY", valor: "abc" },
  ]);
  assert.equal(contarClaves(filas), 2);
});

test("Variables que inyectan los recursos elegidos: PostgreSQL trae DATABASE_URL y PG*, y la clave propia gana", () => {
  const inyectadas = variablesInyectadasPor(["postgres"]);
  const claves = inyectadas.flatMap((grupo) => grupo.claves);
  assert.equal(inyectadas[0].tipo, "postgres");
  assert.ok(claves.includes("DATABASE_URL") && claves.includes("PGHOST"));
  const filas = [{ clave: "DATABASE_URL", valor: "postgres://mia", editada: false, nueva: true }, { ...filaNueva(), clave: "NODE_ENV" }];
  assert.deepEqual([...clavesQueGanan(filas, claves)], ["DATABASE_URL"]);
});

test("variablesInyectadasPor respeta el orden fijo de los tipos", () => {
  assert.deepEqual(variablesInyectadasPor(["s3", "postgres"]).map((g) => g.tipo), ["postgres", "s3"]);
});

test("Límite de datos del plan en el asistente: con 1 de 1 usado las tres tarjetas quedan deshabilitadas", () => {
  const opciones = opcionesAlta({ usados: 1, maximo: 1 }, []);
  assert.deepEqual(opciones.map((o) => o.deshabilitado), [true, true, true]);
});

test("al llenar el plan solo se pueden desmarcar los elegidos", () => {
  const opciones = opcionesAlta({ usados: 0, maximo: 1 }, ["redis"]);
  assert.deepEqual(opciones.map((o) => [o.tipo, o.elegido, o.deshabilitado]), [
    ["postgres", false, true],
    ["redis", true, false],
    ["s3", false, true],
  ]);
});

test("sin tope (autoalojado) nunca deshabilita y el texto lo dice", () => {
  assert.ok(opcionesAlta({ usados: 9, maximo: null }, ["postgres", "redis"]).every((o) => !o.deshabilitado));
  assert.equal(textoLimiteAlta({ usados: 9, maximo: null }, 0), "Sin límite de bases de datos");
  assert.equal(textoLimiteAlta({ usados: 1, maximo: 3 }, 1), "Usas 1 de 3 bases de datos del plan · este proyecto agrega 1");
});

test("alternarTipo agrega en orden fijo y quita", () => {
  assert.deepEqual(alternarTipo(["s3"], "postgres"), ["postgres", "s3"]);
  assert.deepEqual(alternarTipo(["postgres", "s3"], "postgres"), ["s3"]);
});

test("quitarFila deja una fila vacía en el alta y ninguna en 17", () => {
  const una = [{ ...filaNueva(), clave: "A" }];
  assert.equal(quitarFila(una, 0, true).length, 1);
  assert.equal(quitarFila(una, 0, true)[0].clave, "");
  assert.equal(quitarFila(una, 0, false).length, 0);
});
