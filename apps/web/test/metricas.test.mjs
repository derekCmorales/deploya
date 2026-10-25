import test from "node:test";
import assert from "node:assert";

import {
  cuerpoBanner,
  ESTADO_METRICAS_INICIAL,
  estadoEnPalabra,
  mostrarErrorDeMetricas,
  reducirMetricas,
  textoBanner,
  tonoDeUso,
  ventanaDe,
  vistaMetricas,
  vistaResumen,
} from "../src/lib/metricas.ts";
import { eventoEnX } from "../src/components/deploya/graficas/series.ts";

const AHORA = new Date("2026-10-20T18:00:00Z");

function respuesta(overrides = {}) {
  return {
    limite: { cpu: 0.5, memoriaMb: 512 },
    serie: [
      { en: "2026-10-20T13:10:00Z", cpu: 0.1, memoriaMb: 341 },
      { en: "2026-10-20T17:00:00Z", cpu: 0.12, memoriaMb: 430 },
    ],
    pico: {
      cpu: { valor: 0.27, en: "2026-10-20T03:30:20Z" },
      memoriaMb: { valor: 452, en: "2026-10-20T14:00:40Z" },
    },
    aviso: null,
    despliegues: [
      { en: "2026-10-19T20:12:00Z", version: 13 },
      { en: "2026-10-20T13:00:00Z", version: 14 },
    ],
    promedioPorVersion: [
      { version: 13, memoriaMb: 340, cpu: 0.08 },
      { version: 14, memoriaMb: 417, cpu: 0.1 },
    ],
    ...overrides,
  };
}

test("estadoEnPalabra en sus bordes (79 %, 80 %, 100 %)", () => {
  assert.strictEqual(estadoEnPalabra(79), "Holgada");
  assert.strictEqual(estadoEnPalabra(80), "Cerca del límite");
  assert.strictEqual(estadoEnPalabra(100), "Al límite");
});

test("textoBanner y cuerpoBanner arman el aviso con datos", () => {
  assert.strictEqual(textoBanner(84, "Starter"), "La memoria está al 84 % del límite de Starter");
  assert.strictEqual(textoBanner(84, null), "La memoria está al 84 % del límite del plan");
  assert.strictEqual(
    cuerpoBanner("Subió unos 89 MB desde la versión #14", 512),
    "Subió unos 89 MB desde la versión #14. Si llega a 512 MB, Docker reinicia el contenedor.",
  );
});

test("Memoria cerca del límite", () => {
  const vista = vistaMetricas(respuesta(), "Starter", "24h", AHORA);

  assert.strictEqual(vista.memoria.porcentaje, 84);
  assert.strictEqual(vista.memoria.estado, "Cerca del límite");
  assert.strictEqual(vista.memoria.delta.texto, "▲ 89 MB desde #14");
  assert.strictEqual(vista.banner.titulo, "La memoria está al 84 % del límite de Starter");
  assert.match(vista.banner.cuerpo, /Subió unos 89 MB desde la versión #14\./);
  assert.match(vista.banner.cuerpo, /Si llega a 512 MB, Docker reinicia el contenedor\./);
  assert.strictEqual(tonoDeUso(430, 512), "aviso");
  assert.strictEqual(tonoDeUso(409, 512), "normal");
});

test("El banner usa el mismo estado redondeado que el badge", () => {
  const vista = vistaMetricas(
    respuesta({
      serie: [{ en: "2026-10-20T17:00:00Z", cpu: 0.12, memoriaMb: 409.5 }],
    }),
    "Starter",
    "24h",
    AHORA,
  );

  assert.strictEqual(tonoDeUso(409.5, 512), "normal");
  assert.strictEqual(vista.memoria.porcentaje, 80);
  assert.strictEqual(vista.memoria.estado, "Cerca del límite");
  assert.ok(vista.banner, "el banner sigue al estado del badge");
  assert.strictEqual(vista.banner.titulo, "La memoria está al 80 % del límite de Starter");
});

test("Despliegue en la ventana", () => {
  const vista = vistaMetricas(respuesta(), "Starter", "24h", AHORA);

  assert.deepStrictEqual(
    vista.eventos.map((evento) => evento.version),
    [13, 14],
  );
  assert.strictEqual(vista.comparacion.etiqueta, "Comparar #13 y #14");
  assert.strictEqual(vista.comparacion.actual, 14);
  assert.match(vista.promedios, /#13: 340 MB/);
  assert.match(vista.promedios, /#14: 417 MB/);

  const ventana = ventanaDe("24h", AHORA);
  const inicio = ventana.inicio.toISOString();
  const fin = ventana.fin.toISOString();
  const ancho = 960;
  const evento = vista.eventos[1];
  const x = eventoEnX(evento, inicio, fin, ancho);
  const esperado = ((Date.parse(evento.en) - Date.parse(inicio)) / (Date.parse(fin) - Date.parse(inicio))) * ancho;
  assert.ok(x !== null && Math.abs(x - esperado) < 1e-6, "el chip #14 cae en su hora");
});

test("Sin datos", () => {
  const sinDatos = respuesta({
    aviso: "El contenedor no está corriendo",
    serie: [],
    pico: { cpu: null, memoriaMb: null },
    despliegues: [],
    promedioPorVersion: [],
  });

  assert.strictEqual(sinDatos.aviso, "El contenedor no está corriendo");

  const vista = vistaMetricas(sinDatos, "Starter", "24h", AHORA);
  assert.strictEqual(vista.banner, null);
  assert.strictEqual(vista.memoria, null);
  assert.strictEqual(vista.cpu, null);
  assert.strictEqual(vista.series.memoria.length, 0);
  assert.strictEqual(vistaResumen(sinDatos, AHORA), null);
});

test("Resumen de 24 h", () => {
  const vista = vistaResumen(respuesta(), AHORA);

  assert.ok(vista);
  assert.strictEqual(vista.cpu.porcentaje, 24);
  assert.strictEqual(vista.cpu.estado, "Holgada");
  assert.strictEqual(vista.cpu.cifra, "0.12");
  assert.strictEqual(vista.memoria.porcentaje, 84);
  assert.strictEqual(vista.memoria.estado, "Cerca del límite");
  assert.strictEqual(vista.memoria.delta.texto, "▲ 89 MB desde #14");
  assert.strictEqual(vista.limiteMemoria, 512);
});

test("Resumen sin muestras", () => {
  const vista = vistaResumen(
    respuesta({
      serie: [],
      pico: { cpu: null, memoriaMb: null },
      despliegues: [],
      promedioPorVersion: [],
    }),
    AHORA,
  );

  assert.ok(vista, "la tarjeta sigue visible mientras llega la primera muestra");
  assert.strictEqual(vista.memoria, null);
  assert.strictEqual(vista.cpu, null);
  assert.strictEqual(vista.series.memoria.length, 0);
  assert.strictEqual(vista.series.cpu.length, 0);
});

test("Sin muestra posterior al último despliegue no hay delta", () => {
  const vista = vistaMetricas(
    respuesta({
      serie: [{ en: "2026-10-20T12:00:00Z", cpu: 0.12, memoriaMb: 430 }],
    }),
    "Starter",
    "24h",
    AHORA,
  );

  assert.strictEqual(vista.memoria.delta, null);
});

test("Un fallo conserva los datos y el error solo ocupa la pantalla sin datos", () => {
  const conDatos = reducirMetricas(ESTADO_METRICAS_INICIAL, {
    tipo: "exito",
    datos: respuesta(),
    leidoEn: AHORA.toISOString(),
  });
  const conFallo = reducirMetricas(conDatos, { tipo: "fallo", error: new Error("sin conexión") });

  assert.strictEqual(conFallo.datos, conDatos.datos);
  assert.strictEqual(conFallo.leidoEn, conDatos.leidoEn);
  assert.ok(conFallo.error);
  assert.strictEqual(mostrarErrorDeMetricas(conFallo.datos, conFallo.error), false);

  const sinDatos = reducirMetricas(ESTADO_METRICAS_INICIAL, {
    tipo: "fallo",
    error: new Error("sin conexión"),
  });
  assert.strictEqual(mostrarErrorDeMetricas(sinDatos.datos, sinDatos.error), true);
  assert.strictEqual(mostrarErrorDeMetricas(conDatos.datos, conDatos.error), false);
});

test("Reintentar conserva los datos; cambiar de rango los limpia", () => {
  const conDatos = reducirMetricas(ESTADO_METRICAS_INICIAL, {
    tipo: "exito",
    datos: respuesta(),
    leidoEn: AHORA.toISOString(),
  });
  const conFallo = reducirMetricas(conDatos, { tipo: "fallo", error: new Error("sin conexión") });
  const reintento = reducirMetricas(conFallo, { tipo: "reintento" });

  assert.strictEqual(reintento.datos, conDatos.datos);
  assert.strictEqual(reintento.error, null);

  const limpiar = reducirMetricas(reintento, { tipo: "limpiar" });
  assert.strictEqual(limpiar.datos, null);
  assert.strictEqual(limpiar.error, null);
  assert.strictEqual(limpiar.leidoEn, null);
});
