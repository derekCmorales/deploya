import assert from "node:assert/strict";
import test from "node:test";

import { contarCambios, cuerpoVariables, errorClave, textoCambios, variablesDeAlta } from "../src/lib/variables.ts";

test("11c · validación de clave en el cliente", () => {
  assert.equal(errorClave(""), null);
  assert.equal(errorClave("SALUDO"), null);
  assert.match(errorClave("PORT") ?? "", /reservada/);
  assert.match(errorClave("saludo") ?? "", /MAYÚSCULAS/);
  assert.match(errorClave("MI VARIABLE") ?? "", /MAYÚSCULAS/);
});

test("17 · conteo de cambios sin aplicar", () => {
  const guardadas = ["SALUDO", "MODO"];
  assert.equal(contarCambios(guardadas, [{ clave: "SALUDO", editada: false, nueva: false }, { clave: "MODO", editada: false, nueva: false }]), 0);
  assert.equal(
    contarCambios(guardadas, [
      { clave: "SALUDO", valor: "hola", editada: true, nueva: false },
      { clave: "MODO", editada: false, nueva: false },
    ]),
    1,
  );
  assert.equal(contarCambios(guardadas, [{ clave: "SALUDO", editada: false, nueva: false }]), 1);
  assert.equal(
    contarCambios(guardadas, [
      { clave: "SALUDO", editada: false, nueva: false },
      { clave: "MODO", editada: false, nueva: false },
      { clave: "EXTRA", valor: "1", editada: false, nueva: true },
    ]),
    1,
  );
  assert.equal(textoCambios(1), "1 cambio sin aplicar");
  assert.equal(textoCambios(2), "2 cambios sin aplicar");
});

test("17 · armado del cuerpo del PUT", () => {
  assert.deepEqual(
    cuerpoVariables([
      { clave: "SALUDO", editada: false, nueva: false },
      { clave: "MODO", valor: "prod", editada: true, nueva: false },
      { clave: "", valor: "x", editada: true, nueva: true },
    ]),
    [{ clave: "SALUDO" }, { clave: "MODO", valor: "prod" }],
  );
  assert.deepEqual(
    cuerpoVariables([{ clave: "SALUDO", valor: "hola", editada: true, nueva: false, oculta: true }]),
    [{ clave: "SALUDO", valor: "hola" }],
  );
  assert.deepEqual(variablesDeAlta([{ clave: " SALUDO ", valor: "hola" }, { clave: "", valor: "" }]), [{ clave: "SALUDO", valor: "hola" }]);
});
