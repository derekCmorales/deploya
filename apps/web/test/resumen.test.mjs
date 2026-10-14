import assert from "node:assert/strict";
import test from "node:test";

import {
  detalleImagen,
  duracionConstruccion,
  duracionTotalMs,
  horaHito,
  seguirResumen,
  tamanoImagen,
  textoActualizado,
  textoCpu,
  textoMemoria,
  textoPuerto,
} from "../src/lib/resumen.ts";

const MB = 1024 * 1024;

test("la imagen se muestra en MB y con el tiempo de construcción si lo hubo", () => {
  const imagen = { numero: 14, digest: "sha256:abc", tamanoBytes: 148 * MB, receta: "dockerfile" };

  assert.equal(tamanoImagen(148 * MB), "148 MB");
  assert.equal(detalleImagen(imagen, "1 min 52 s"), "148 MB · construida en 1 min 52 s");
  assert.equal(detalleImagen(imagen, null), "148 MB");
});

test("la construcción sale de la etapa del mismo nombre", () => {
  const etapas = [
    { nombre: "recepcion", estado: "completada", duracionMs: 1400 },
    { nombre: "construccion", estado: "completada", duracionMs: 112_000 },
  ];

  assert.equal(duracionConstruccion({ etapas }), 112_000);
  assert.equal(duracionConstruccion({ etapas: [{ nombre: "construccion", estado: "omitida", duracionMs: null }] }), null);
});

test("recursos aplicados: CPU, memoria y puerto", () => {
  assert.equal(textoCpu(0.5), "0.5 vCPU");
  assert.equal(textoMemoria(512), "512 MB");
  assert.equal(textoPuerto(8080, "https"), "8080 → 443");
  assert.equal(textoPuerto(8080, "http"), "8080 → 80");
});

test("Actualizado hace N s con el reloj fijo", () => {
  assert.equal(textoActualizado(1_000_000, 1_004_000), "Actualizado hace 4 s");
  assert.equal(textoActualizado(1_000_000, 1_000_000), "Actualizado hace 0 s");
  assert.equal(textoActualizado(1_000_000, 1_150_000), "Actualizado hace 2 min");
  assert.equal(textoActualizado(2_000_000, 1_000_000), "Actualizado hace 0 s");
});

test("la hora de un hito y la duración total del último despliegue", () => {
  assert.equal(horaHito("2026-10-14T12:05:53.000Z"), "12:05:53");
  assert.equal(duracionTotalMs({ creado: "2026-10-14T12:04:01.000Z", terminado: "2026-10-14T12:06:42.000Z" }), 161_000);
  assert.equal(duracionTotalMs({ creado: "2026-10-14T12:04:01.000Z", terminado: null }), null);
});

test("el sondeo del resumen sigue mientras algo esté en curso o una acción no haya cambiado el estado", () => {
  const enCurso = (estado) => !["saludable", "fallido", "cancelado", "detenido"].includes(estado);
  const con = (activo, ultimo) => ({ activo: activo && { estado: activo }, ultimo: ultimo && { estado: ultimo } });

  assert.equal(seguirResumen(con("saludable", "saludable"), null, enCurso), false);
  assert.equal(seguirResumen(con("saludable", "construyendo"), null, enCurso), true);
  assert.equal(seguirResumen(con("saludable", "saludable"), "saludable", enCurso), true);
  assert.equal(seguirResumen(con("detenido", "detenido"), "saludable", enCurso), false);
  assert.equal(seguirResumen(con(null, null), null, enCurso), false);
});
