import test from "node:test";
import assert from "node:assert";

import {
  cursorDe,
  ESTADO_BITACORA_INICIAL,
  filtrarLineas,
  MAX_LINEAS_BITACORA,
  nombreDescarga,
  pausar,
  reanudar,
  recibirLineas,
  textoActualizado,
  textoDescarga,
  textoPausa,
  textoResumen,
  textoVersion,
} from "../src/lib/bitacoras.ts";

const BASE = Date.parse("2026-10-20T10:41:52.118Z");
const linea = (s, texto, nivel = "info") => ({ en: new Date(BASE + s * 1000).toISOString(), texto, nivel });

const PRIMERAS = [
  linea(0, "INFO GET /health 200 · 2 ms"),
  linea(1, "WARN pool de conexiones al 85 % (17/20)", "aviso"),
  linea(2, "ERROR POST /api/pagos 502 · pasarela sin respuesta tras 5000 ms", "error"),
  linea(3, "ERROR at ClientePagos.cobrar (dist/pagos/cliente.js:48:13)", "error"),
  linea(4, "INFO POST /api/pagos 200 · 380 ms (reintento 1)"),
];
const SEIS = Array.from({ length: 6 }, (_, i) => linea(10 + i, `INFO GET /api/carrito ${i}`));

test("Pausa sin perder líneas", () => {
  let estado = recibirLineas(ESTADO_BITACORA_INICIAL, PRIMERAS);
  estado = pausar(estado);
  estado = recibirLineas(estado, SEIS);

  assert.equal(estado.lineas.length, PRIMERAS.length);
  assert.equal(textoPausa(estado.pendientes.length), "En pausa · 6 líneas nuevas");
  assert.equal(cursorDe(estado), SEIS[5].en, "la siguiente consulta sigue desde lo apartado");

  estado = reanudar(estado);

  assert.equal(estado.pausada, false);
  assert.deepEqual(estado.pendientes, []);
  assert.deepEqual(
    estado.lineas.map((l) => l.n),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  );
  assert.equal(estado.lineas.at(-1).texto, "INFO GET /api/carrito 5");
});

test("Filtro por nivel", () => {
  const { lineas } = recibirLineas(ESTADO_BITACORA_INICIAL, PRIMERAS);

  const errores = filtrarLineas(lineas, "error", "");

  assert.deepEqual(
    errores.map((l) => l.n),
    [3, 4],
  );
  assert.ok(errores.every((l) => l.nivel === "error"));
  assert.equal(filtrarLineas(lineas, "todos", "").length, PRIMERAS.length);
  assert.equal(filtrarLineas(lineas, "aviso", "").length, 1);
});

test("la búsqueda es texto sin mayúsculas y se combina con el nivel", () => {
  const { lineas } = recibirLineas(ESTADO_BITACORA_INICIAL, PRIMERAS);

  assert.deepEqual(
    filtrarLineas(lineas, "todos", "  /API/PAGOS ").map((l) => l.n),
    [3, 5],
  );
  assert.deepEqual(
    filtrarLineas(lineas, "info", "/api/pagos").map((l) => l.n),
    [5],
  );
  assert.equal(filtrarLineas(lineas, "todos", "(.*").length, 0, "no es una expresión regular");
});

test("se quedan las últimas 500 líneas, también en pausa", () => {
  const muchas = Array.from({ length: MAX_LINEAS_BITACORA + 5 }, (_, i) => linea(i, `INFO ${i}`));

  const estado = recibirLineas(ESTADO_BITACORA_INICIAL, muchas);
  const enPausa = recibirLineas(pausar(ESTADO_BITACORA_INICIAL), muchas);

  assert.equal(estado.lineas.length, MAX_LINEAS_BITACORA);
  assert.equal(estado.lineas[0].n, 6);
  assert.equal(enPausa.pendientes.length, MAX_LINEAS_BITACORA);
  assert.equal(reanudar(enPausa).lineas.length, MAX_LINEAS_BITACORA);
});

test("sin líneas nuevas el estado no cambia y el cursor empieza vacío", () => {
  assert.equal(recibirLineas(ESTADO_BITACORA_INICIAL, []), ESTADO_BITACORA_INICIAL);
  assert.equal(cursorDe(ESTADO_BITACORA_INICIAL), null);
});

test("textos de la pantalla 15", () => {
  const { lineas } = recibirLineas(ESTADO_BITACORA_INICIAL, PRIMERAS);

  assert.equal(textoResumen(lineas), "5 líneas · 2 errores · 1 aviso");
  assert.equal(textoResumen(lineas.slice(0, 1)), "1 línea · 0 errores · 0 avisos");
  assert.equal(textoPausa(1), "En pausa · 1 línea nueva");
  assert.equal(textoVersion({ numero: 14, commit: "a1b2c3d4e5f6" }), "versión #14 · a1b2c3d");
  assert.equal(textoVersion({ numero: 14, commit: null }), "versión #14");
  assert.equal(textoVersion(null), null);
  assert.equal(textoActualizado("2026-10-20T10:42:00.000Z", new Date("2026-10-20T10:42:02.300Z")), "Actualizado hace 2 s · cada 3 s");
  assert.equal(textoActualizado(null, new Date()), null);
});

test("la descarga lleva la marca ISO y el texto de lo que se ve", () => {
  const { lineas } = recibirLineas(ESTADO_BITACORA_INICIAL, PRIMERAS.slice(0, 2));

  assert.equal(
    textoDescarga(lineas),
    "2026-10-20T10:41:52.118Z INFO GET /health 200 · 2 ms\n2026-10-20T10:41:53.118Z WARN pool de conexiones al 85 % (17/20)\n",
  );
  assert.equal(textoDescarga([]), "");
  assert.equal(nombreDescarga("api-tienda", new Date("2026-10-20T10:42:00.000Z")), "api-tienda-2026-10-20T10-42-00-000Z.log");
});
