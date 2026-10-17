import assert from "node:assert/strict";
import test from "node:test";

import {
  borradorDe,
  cambiosDe,
  erroresDeBorrador,
  errorDeGuardado,
  hayCambios,
  rutaNormalizada,
  textoHistorial,
  textoVariables,
} from "../src/lib/configuracion.ts";

const proyecto = {
  nombre: "api-tienda",
  urlRepositorio: "https://github.com/tienda-demo/api-tienda",
  rama: "main",
  rutaDockerfile: "Dockerfile",
  puertoInterno: 8080,
};

test("19 · el borrador muestra la ruta como /Dockerfile y el puerto como texto", () => {
  assert.deepEqual(borradorDe(proyecto), {
    nombre: "api-tienda",
    urlRepositorio: "https://github.com/tienda-demo/api-tienda",
    rama: "main",
    rutaDockerfile: "/Dockerfile",
    puertoInterno: "8080",
  });
});

test("19 · cambiosDe devuelve solo lo que cambió y sin cambios deshabilita Guardar", () => {
  const original = borradorDe(proyecto);

  assert.deepEqual(cambiosDe(original, { ...original }), {});
  assert.equal(hayCambios(cambiosDe(original, { ...original })), false);
  assert.deepEqual(cambiosDe(original, { ...original, rama: "sin-dockerfile" }), { rama: "sin-dockerfile" });
  assert.deepEqual(cambiosDe(original, { ...original, nombre: " Hola demo ", puertoInterno: "3000" }), { nombre: "Hola demo", puertoInterno: 3000 });
  assert.equal(hayCambios(cambiosDe(original, { ...original, rama: "dev" })), true);
});

test("19 · Descartar: volver al original equivale a no tener cambios", () => {
  const original = borradorDe(proyecto);
  const editado = { ...original, rama: "dev", puertoInterno: "9000" };

  assert.equal(hayCambios(cambiosDe(original, editado)), true);
  assert.equal(hayCambios(cambiosDe(original, borradorDe(proyecto))), false);
});

test("19 · /Dockerfile y Dockerfile son la misma ruta; una ruta distinta sí cuenta", () => {
  const original = borradorDe(proyecto);

  assert.equal(rutaNormalizada("/Dockerfile"), "Dockerfile");
  assert.equal(rutaNormalizada("./docker/Dockerfile"), "docker/Dockerfile");
  assert.deepEqual(cambiosDe(original, { ...original, rutaDockerfile: "Dockerfile" }), {});
  assert.deepEqual(cambiosDe(original, { ...original, rutaDockerfile: "/docker/Dockerfile.prod" }), { rutaDockerfile: "docker/Dockerfile.prod" });
});

test("19 · un borrador válido no tiene errores y cada campo inválido tiene el suyo", () => {
  const ok = borradorDe(proyecto);

  assert.deepEqual(erroresDeBorrador(ok), {});
  assert.ok(erroresDeBorrador({ ...ok, nombre: "  " }).nombre);
  assert.ok(erroresDeBorrador({ ...ok, nombre: "a".repeat(65) }).nombre);
  assert.deepEqual(Object.keys(erroresDeBorrador({ ...ok, urlRepositorio: "https://gitlab.com/a/b" })), ["urlRepositorio"]);
  assert.deepEqual(Object.keys(erroresDeBorrador({ ...ok, rama: " " })), ["rama"]);
  assert.deepEqual(Object.keys(erroresDeBorrador({ ...ok, rutaDockerfile: "../x" })), ["rutaDockerfile"]);
  for (const puerto of ["0", "65536", "abc", "", "80.5"]) {
    assert.deepEqual(Object.keys(erroresDeBorrador({ ...ok, puertoInterno: puerto })), ["puertoInterno"], puerto);
  }
  assert.deepEqual(erroresDeBorrador({ ...ok, puertoInterno: "65535" }), {});
});

test("19 · cada código de la API se pinta bajo su campo; lo demás es un aviso general", () => {
  assert.deepEqual(errorDeGuardado("nombre-repetido", "x"), { campo: "nombre", mensaje: "x" });
  assert.equal(errorDeGuardado("rama-no-encontrada", "x").campo, "rama");
  assert.equal(errorDeGuardado("repositorio-no-accesible", "x").campo, "urlRepositorio");
  assert.equal(errorDeGuardado("url-invalida", "x").campo, "urlRepositorio");
  assert.equal(errorDeGuardado("ruta-invalida", "x").campo, "rutaDockerfile");
  assert.equal(errorDeGuardado("puerto-invalido", "x").campo, "puertoInterno");
  assert.equal(errorDeGuardado("fuente-no-disponible", "x").campo, null);
  assert.equal(errorDeGuardado("sin-conexion", "x").campo, null);
});

test("19b · los conteos se escriben en singular y plural", () => {
  assert.equal(textoVariables(6), "6 variables de entorno cifradas");
  assert.equal(textoVariables(1), "1 variable de entorno cifrada");
  assert.equal(textoVariables(0), "0 variables de entorno cifradas");
  assert.equal(textoHistorial(14), "El historial de 14 despliegues");
  assert.equal(textoHistorial(1), "El historial de 1 despliegue");
});
