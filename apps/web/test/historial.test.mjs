import assert from "node:assert/strict";
import test from "node:test";

import {
  accionDeFila,
  consultaHistorial,
  digestCorto,
  duracionFila,
  fechaFila,
  fusionarPaginas,
  peticionDeAccion,
  puedeRedesplegar,
} from "../src/lib/historial.ts";

const fila = (numero, extra = {}) => ({
  id: `d${numero}`,
  numero,
  estado: "saludable",
  disparador: "manual",
  commit: { sha: "a1b2c3d4e5f6", mensaje: "feat: algo", rama: "main" },
  creado: "2026-10-14T12:04:01.000Z",
  duracionMs: 161_000,
  imagen: { digest: "sha256:9f2c4e7a0000000000000000000000000000000000000000000000000000e41a", disponible: true },
  artefactoId: `a${numero}`,
  activo: false,
  ...extra,
});

test("Fila activa marcada: la activa es «versión activa» y un fallido más reciente ofrece reintentar", () => {
  assert.equal(accionDeFila(fila(13, { activo: true })), "version-activa");
  assert.equal(accionDeFila(fila(14, { estado: "fallido", imagen: null, artefactoId: null })), "reintentar");
});

test("Revertir solo con el artefacto disponible y sin ser el activo", () => {
  assert.equal(accionDeFila(fila(12)), "revertir");
  assert.equal(accionDeFila(fila(12, { activo: true })), "version-activa");
});

test("Imagen retirada: la reversión aparece deshabilitada", () => {
  assert.equal(accionDeFila(fila(2, { imagen: { digest: "sha256:abc", disponible: false } })), "imagen-retirada");
});

test("sin imagen y sin fallo no hay acción (cancelado, en curso)", () => {
  assert.equal(accionDeFila(fila(15, { estado: "cancelado", imagen: null, artefactoId: null })), "ninguna");
  assert.equal(accionDeFila(fila(16, { estado: "construyendo", imagen: null, artefactoId: null })), "ninguna");
});

test("Redesplegar reconstruye un commit que sirvió tráfico, no el de la activa ni el de un fallo", () => {
  assert.equal(puedeRedesplegar(fila(12)), true);
  assert.equal(puedeRedesplegar(fila(12, { estado: "detenido" })), true);
  assert.equal(puedeRedesplegar(fila(13, { activo: true })), false);
  assert.equal(puedeRedesplegar(fila(11, { estado: "fallido" })), false);
  assert.equal(puedeRedesplegar(fila(10, { commit: null })), false);
});

test("la consulta lleva el filtro y, solo con página anterior, el cursor antesDe", () => {
  assert.equal(consultaHistorial("p1", "todos", null), "/proyectos/p1/despliegues?filtro=todos");
  assert.equal(consultaHistorial("p1", "fallidos", 6), "/proyectos/p1/despliegues?filtro=fallidos&antesDe=6");
});

test("Cargar más: la página nueva se suma sin repetir filas y en orden", () => {
  const primera = [fila(25), fila(24), fila(23)];
  const nueva = [fila(24), fila(22), fila(21)];

  const total = fusionarPaginas(primera, nueva);

  assert.deepEqual(total.map((f) => f.numero), [25, 24, 23, 22, 21]);
  assert.deepEqual(fusionarPaginas([], nueva).map((f) => f.numero), [24, 22, 21]);
});

test("el digest se acorta como en la ficha", () => {
  assert.equal(digestCorto("sha256:9f2c4e7a0000000000000000000000000000000000000000000000000000e41a"), "sha256:9f2c4e7a…e41a");
  assert.equal(digestCorto("sha256:abc"), "sha256:abc");
});

test("la duración se escribe en minutos y segundos", () => {
  assert.equal(duracionFila(161_000), "2 min 41 s");
  assert.equal(duracionFila(38_000), "0 min 38 s");
  assert.equal(duracionFila(null), "—");
});

test("la fecha corta dice hoy, ayer o el día", () => {
  const ahora = new Date("2026-10-14T15:00:00.000Z");

  assert.equal(fechaFila("2026-10-14T12:04:00.000Z", ahora), "hoy, 12:04");
  assert.equal(fechaFila("2026-10-13T18:31:00.000Z", ahora), "ayer, 18:31");
  assert.equal(fechaFila("2026-09-21T10:02:00.000Z", ahora), "21 sep, 10:02");
});

test("cada acción de fila llama a su ruta del contrato", () => {
  const f = fila(12, { commit: { sha: "e4f5a6b7c8d9", mensaje: "fix", rama: "main" } });

  assert.deepEqual(peticionDeAccion("revertir", f, "p1"), { ruta: "/proyectos/p1/reversiones", cuerpo: { artefactoId: "a12" } });
  assert.deepEqual(peticionDeAccion("redesplegar", f, "p1"), { ruta: "/proyectos/p1/redespliegues", cuerpo: { commitSha: "e4f5a6b7c8d9" } });
  assert.deepEqual(peticionDeAccion("reintentar", f, "p1"), { ruta: "/despliegues/d12/reintentar" });
});
