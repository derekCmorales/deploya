import test from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";

import {
  acumularSerie,
  porcentajeDe,
  SERIE_NODO_VACIA,
  tarjetasNodo,
  textoCpuEntorno,
  textoEntornos,
  textoMemoriaEntorno,
  textoMemoriaNodo,
  textoNodo,
  textoTrabajo,
} from "../src/lib/admin-infraestructura.ts";

const NODO = { cpu: { usado: 1.24, total: 2 }, memoriaMb: { usado: 2662, total: 4096 }, discoGb: { usado: 31, total: 80 } };

test("Vista del nodo: CPU, memoria y disco con su total", () => {
  assert.deepEqual(
    tarjetasNodo(NODO).map(({ titulo, porcentaje, cifra, de }) => [titulo, porcentaje, cifra, de]),
    [
      ["CPU del nodo", 62, "1.24 vCPU", "de 2 vCPU"],
      ["Memoria", 65, "2.6 GB", "de 4 GB"],
      ["Disco", 39, "31 GB", "de 80 GB · imágenes y artefactos"],
    ],
  );
  assert.equal(textoNodo(NODO, "2026-10-20T10:42:00Z", new Date("2026-10-20T10:42:05Z")), "VPS · 2 vCPU · 4 GB · actualizado hace 5 s");
});

test("Cola atascada: cada encolado muestra su espera y lo que corre su duración", () => {
  assert.equal(textoTrabajo({ estado: "encolado", ms: 40_000 }), "espera 0:40");
  assert.equal(textoTrabajo({ estado: "encolado", ms: 65_000 }), "espera 1:05");
  assert.equal(textoTrabajo({ estado: "construyendo", ms: 72_000 }), "01:12");
});

test("entornos: CPU con dos decimales, memoria en MB o GB y raya sin muestra", () => {
  assert.equal(textoCpuEntorno(0.12), "0.12");
  assert.equal(textoCpuEntorno(1.414), "1.41");
  assert.equal(textoCpuEntorno(null), "—");
  assert.equal(textoMemoriaEntorno(430), "430 MB");
  assert.equal(textoMemoriaEntorno(1638), "1.6 GB");
  assert.equal(textoMemoriaEntorno(null), "—");
  assert.equal(textoMemoriaNodo(4096), "4 GB");
  assert.equal(textoEntornos(6, 41), "6 de 41");
});

test("un total en cero no divide entre cero", () => {
  assert.equal(porcentajeDe({ usado: 0, total: 0 }), 0);
});

test("la serie del nodo suma una lectura por recurso y se queda con las últimas", () => {
  let serie = SERIE_NODO_VACIA;
  for (let i = 0; i < 4; i += 1) serie = acumularSerie(serie, { tomado: `2026-10-20T10:42:0${i}Z`, nodo: NODO }, 3);

  assert.equal(serie.cpu.length, 3);
  assert.deepEqual(serie.cpu[0], { tiempo: "2026-10-20T10:42:01Z", valor: 1.24 });
  assert.equal(serie.memoria.at(-1).valor, 2662);
  assert.equal(serie.disco.at(-1).valor, 31);
});

test("27 · la navegación muestra Infraestructura solo al administrador, en la nube y en autoalojado", () => {
  const nav = readFileSync(new URL("../src/components/shell/nav-panel.tsx", import.meta.url), "utf8");

  assert.match(nav, /href: "\/admin\/infraestructura", texto: "Infraestructura"/);
  assert.match(nav, /usuario\?\.rol === "administrador" \? \[NAV_INFRAESTRUCTURA, \.\.\.NAV_INSTALACION_POR_MODO\[modo\]\] : \[\]/);
});
