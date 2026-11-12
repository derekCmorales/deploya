import assert from "node:assert/strict";
import test from "node:test";

import { catalogoVisible } from "../src/lib/catalogo.ts";
import {
  actividadReciente,
  destinoMarca,
  destinoRaizSinSesion,
  grupoDeProyecto,
  proyectosParaInicio,
  resumenEstados,
  saludo,
  textoResumenEstados,
} from "../src/lib/inicio.ts";

const LANDING = "https://deploya.example.com";

function despliegue(numero, estado, creado) {
  return { id: `d${numero}`, numero, estado, etapas: [], creado };
}

function proyecto(nombre, ultimo) {
  return { id: nombre, nombre, subdominio: nombre, urlRepositorio: "", rama: "main", rutaDockerfile: "Dockerfile", puertoInterno: 8080, creado: "2026-11-01T00:00:00Z", ultimoDespliegue: ultimo };
}

const LISTA = {
  proyectos: [
    proyecto("tienda", despliegue(4, "saludable", "2026-11-10T10:00:00Z")),
    proyecto("api", despliegue(9, "construyendo", "2026-11-12T09:00:00Z")),
    proyecto("worker", despliegue(2, "fallido", "2026-11-11T08:00:00Z")),
    proyecto("borrador", null),
  ],
  usados: 4,
  maximo: 5,
  plan: { nombre: "Starter", cpus: 0.5, memoriaMb: 512 },
};

test("00 · sin sesión, la raíz en la nube lleva a la landing", () => {
  assert.equal(destinoRaizSinSesion("nube", LANDING), LANDING);
});

test("00 · sin landing configurada o en autoalojado, la raíz lleva a iniciar sesión", () => {
  assert.equal(destinoRaizSinSesion("nube", ""), "/ingresar");
  assert.equal(destinoRaizSinSesion("nube", undefined), "/ingresar");
  assert.equal(destinoRaizSinSesion("autoalojado", LANDING), "/ingresar");
});

test("00 · una landing que no es URL absoluta se ignora", () => {
  assert.equal(destinoRaizSinSesion("nube", "javascript:alert(1)"), "/ingresar");
  assert.equal(destinoRaizSinSesion("nube", "//otro.com"), "/ingresar");
});

test("00 · la marca lleva al panel con sesión y a la landing sin ella", () => {
  assert.equal(destinoMarca(true, "nube", LANDING), "/");
  assert.equal(destinoMarca(false, "nube", LANDING), LANDING);
  assert.equal(destinoMarca(false, "autoalojado", LANDING), "/ingresar");
});

test("00 · el saludo usa el primer nombre", () => {
  assert.equal(saludo("Derek Morales"), "Hola, Derek");
  assert.equal(saludo("  "), "Hola");
  assert.equal(saludo(null), "Hola");
});

test("00 · cada proyecto cae en un grupo según su último despliegue", () => {
  assert.equal(grupoDeProyecto(LISTA.proyectos[0]), "en-linea");
  assert.equal(grupoDeProyecto(LISTA.proyectos[1]), "en-curso");
  assert.equal(grupoDeProyecto(LISTA.proyectos[2]), "con-fallo");
  assert.equal(grupoDeProyecto(LISTA.proyectos[3]), "sin-desplegar");
  assert.equal(grupoDeProyecto(proyecto("x", despliegue(1, "revirtiendo", "2026-11-01T00:00:00Z"))), "en-curso");
});

test("00 · el subtítulo resume los estados y omite los ceros", () => {
  const resumen = resumenEstados(LISTA);
  assert.deepEqual(resumen, { "en-linea": 1, "en-curso": 1, "con-fallo": 1, "sin-desplegar": 1, detenido: 0 });
  assert.equal(textoResumenEstados(resumen), "1 en línea · 1 en curso · 1 con fallo · 1 sin desplegar");
  assert.equal(textoResumenEstados(resumenEstados({ proyectos: [] })), "");
});

test("00 · la actividad reciente va del despliegue más nuevo al más viejo y respeta el máximo", () => {
  const actividad = actividadReciente(LISTA);
  assert.deepEqual(
    actividad.map((a) => `${a.proyecto}#${a.despliegue.numero}`),
    ["api#9", "worker#2", "tienda#4"],
  );
  assert.equal(actividadReciente(LISTA, 1).length, 1);
});

test("00 · los proyectos del panel muestran primero lo que pide atención", () => {
  assert.deepEqual(
    proyectosParaInicio(LISTA.proyectos).map((p) => p.nombre),
    ["api", "worker", "tienda", "borrador"],
  );
  assert.equal(proyectosParaInicio(LISTA.proyectos, 2).length, 2);
});

test("el catálogo /sistema se ve en desarrollo y se oculta en producción salvo que se pida", () => {
  assert.equal(catalogoVisible("development", undefined), true);
  assert.equal(catalogoVisible("production", undefined), false);
  assert.equal(catalogoVisible("production", "1"), true);
});
