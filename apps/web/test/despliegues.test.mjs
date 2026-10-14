import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  accionesDe,
  aplicarBloque,
  avisoVersionAnterior,
  etiquetaEtapaActual,
  fusionarLineas,
  lineaDeError,
  marcaVisible,
  puedeDetener,
  puedeReiniciar,
  rutaCancelar,
  rutaDespliegue,
  rutaReintentar,
  sondearBitacora,
  textoParaCopiar,
  tiempoTranscurrido,
} from "../src/lib/despliegues.ts";

const linea = (n, texto, extra = {}) => ({ n, marca: "12:04:01.112", etapa: "construccion", texto, ...extra });

test("Construcción en curso: las líneas nuevas se agregan en orden sin duplicar", () => {
  const previas = [linea(1, "Clonando")];
  const nuevas = [linea(1, "reescrita"), linea(3, "tarde"), linea(2, "Compilando")];
  const resultado = fusionarLineas(previas, nuevas);
  assert.deepEqual(resultado.map((l) => l.n), [1, 2, 3]);
  assert.equal(resultado[0].texto, "Clonando");
  assert.equal(resultado[1].texto, "Compilando");
});

test("Construcción fallida: línea del error y aviso de la versión anterior", () => {
  const lineas = [linea(1, "Compilando"), linea(2, "sh: tsc: not found", { nivel: "error" }), linea(3, "fin")];
  assert.equal(lineaDeError(lineas)?.n, 2);
  assert.equal(lineaDeError([linea(4, "falló la etapa")], "construccion")?.n, 4);
  assert.equal(lineaDeError([linea(4, "otra")], "recepcion"), undefined);
  assert.equal(avisoVersionAnterior(13), "Tu versión #13 sigue sirviendo tráfico.");
  assert.equal(avisoVersionAnterior(null), null);
});

test("Copiar bitácora", () => {
  const texto = textoParaCopiar([linea(1, "Clonando github.com/tienda-demo/api-tienda (main)")]);
  assert.equal(texto, "1 12:04:01.112 Clonando github.com/tienda-demo/api-tienda (main)");
});

test("Tiempo transcurrido con ahora fijo", () => {
  assert.equal(tiempoTranscurrido("2026-06-06T10:00:00.000Z", "2026-06-06T10:01:41.000Z"), "01:41");
  assert.equal(tiempoTranscurrido("2026-06-06T10:00:00.000Z", "2026-06-06T09:00:00.000Z"), "00:00");
});

test("marca ISO a HH:mm:ss.SSS", () => {
  assert.equal(marcaVisible("2026-06-06T12:04:01.112Z"), "12:04:01.112");
  assert.equal(marcaVisible("12:04:01.112"), "12:04:01.112");
});

test("El polling termina con el despliegue", async () => {
  const llamadas = [];
  const pedir = async (desde) => {
    llamadas.push(desde);
    if (desde === 0) return { lineas: [linea(1, "Clonando")], siguiente: 1, terminado: false };
    return { lineas: [linea(1, "Clonando"), linea(2, "Error", { nivel: "error" })], siguiente: 2, terminado: true };
  };
  const lineas = await sondearBitacora(pedir);
  assert.deepEqual(llamadas, [0, 1]);
  assert.deepEqual(lineas.map((l) => l.n), [1, 2]);
  const parado = aplicarBloque(lineas, 1, { lineas: [], siguiente: 2, terminado: true });
  assert.equal(parado.terminado, true);
  assert.equal(parado.desde, 1);
});

test("12 · la ruta y la etiqueta de etapa salen del número", () => {
  assert.equal(rutaDespliegue("proy-1", 14), "/projects/proy-1/despliegues/14");
  assert.equal(etiquetaEtapaActual([{ estado: "completada" }, { estado: "en-curso" }]), "02 · Construcción");
  assert.equal(etiquetaEtapaActual([{ estado: "completada" }, { estado: "fallida" }]), "02 · Construcción");
  assert.equal(etiquetaEtapaActual([{ estado: "completada" }]), null);
});

test("12 y 12c · la vista ofrece Cancelar despliegue y Reintentar con los textos de la ficha y usa la bitácora del sistema", () => {
  const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
  const panel = readFileSync(join(raiz, "src/app/(projects)/projects/_componentes/panel-despliegue.tsx"), "utf8");
  assert.match(panel, /Bitácora de construcción/);
  assert.match(panel, /Se actualiza cada 3 s/);
  assert.match(panel, /Copiar/);
  assert.match(panel, /Cancelar despliegue/);
  assert.match(panel, /Reintentar/);
  assert.match(panel, /accionesDe\(/);
  assert.match(panel, /AccionesContenedor/);
  const acciones = readFileSync(join(raiz, "src/app/(projects)/projects/_componentes/acciones-contenedor.tsx"), "utf8");
  assert.match(acciones, /Reiniciar/);
  assert.match(acciones, /Detener/);
  assert.doesNotMatch(panel, /\bfetch\(/);
});

test("12b · Reiniciar y Detener solo cuando el contrato lo permite", () => {
  assert.equal(puedeReiniciar("saludable"), true);
  assert.equal(puedeReiniciar("detenido"), true);
  assert.equal(puedeReiniciar("construyendo"), false);
  assert.equal(puedeDetener("saludable"), true);
  assert.equal(puedeDetener("detenido"), false);
  assert.equal(puedeDetener("fallido"), false);
});

test("accionesDe: Cancelar en Encolado, Construyendo y Revirtiendo; Reintentar solo en Fallido", () => {
  assert.deepEqual(accionesDe("encolado"), { cancelar: true, reintentar: false });
  assert.deepEqual(accionesDe("construyendo"), { cancelar: true, reintentar: false });
  assert.deepEqual(accionesDe("revirtiendo"), { cancelar: true, reintentar: false });
  assert.deepEqual(accionesDe("fallido"), { cancelar: false, reintentar: true });
  for (const estado of ["aprovisionando", "publicando", "saludable", "detenido", "cancelado"]) {
    assert.deepEqual(accionesDe(estado), { cancelar: false, reintentar: false }, estado);
  }
});

test("las rutas de cancelar y reintentar son las del contrato", () => {
  assert.equal(rutaCancelar("d-1"), "/despliegues/d-1/cancelar");
  assert.equal(rutaReintentar("d-1"), "/despliegues/d-1/reintentar");
});
