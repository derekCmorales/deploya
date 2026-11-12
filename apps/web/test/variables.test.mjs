import assert from "node:assert/strict";
import test from "node:test";

import {
  MAXIMO_VARIABLES,
  combinarVariables,
  contarCambios,
  cuerpoVariables,
  errorClave,
  parsearEnv,
  textoCambios,
  textoResumenPegado,
  totalTrasPegar,
  variablesDeAlta,
} from "../src/lib/variables.ts";

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

test("17 · el tope de variables por proyecto es 150", () => {
  assert.equal(MAXIMO_VARIABLES, 150);
});

test("17 · Pegar .env: CLAVE=valor, ignora vacías y comentarios y quita comillas", () => {
  const texto = [
    "# base de datos",
    "",
    "DATABASE_URL=postgres://deploya:x@db:5432/app",
    'SALUDO="hola mundo"',
    "MODO='produccion'",
    "export NODE_ENV=production",
    "TIMEOUT=30 # segundos",
    "HASH=abc#def",
    "VACIA=",
    'MULTI="a\\nb"',
  ].join("\n");
  assert.deepEqual(parsearEnv(texto), {
    variables: [
      { clave: "DATABASE_URL", valor: "postgres://deploya:x@db:5432/app" },
      { clave: "SALUDO", valor: "hola mundo" },
      { clave: "MODO", valor: "produccion" },
      { clave: "NODE_ENV", valor: "production" },
      { clave: "TIMEOUT", valor: "30" },
      { clave: "HASH", valor: "abc#def" },
      { clave: "VACIA", valor: "" },
      { clave: "MULTI", valor: "a\nb" },
    ],
    rechazadas: [],
  });
});

test("17 · Pegar .env: la última clave repetida gana y las inválidas se reportan con su línea", () => {
  const { variables, rechazadas } = parsearEnv("A=1\r\nA=2\nminuscula=3\nPORT=8080\nsin igual\n=sin clave");
  assert.deepEqual(variables, [{ clave: "A", valor: "2" }]);
  assert.deepEqual(rechazadas.map((r) => r.linea), [3, 4, 5, 6]);
  assert.match(rechazadas[0].motivo, /minuscula: .*MAYÚSCULAS/);
  assert.match(rechazadas[1].motivo, /reservada/);
  assert.match(rechazadas[2].motivo, /CLAVE=valor/);
});

test("17 · Pegar .env: pisa las existentes (editadas) y agrega el resto como nuevas", () => {
  const filas = [
    { clave: "SALUDO", editada: false, nueva: false },
    { clave: "MODO", editada: false, nueva: false },
    { clave: "", valor: "", editada: false, nueva: true },
  ];
  const pegadas = [
    { clave: "SALUDO", valor: "hola" },
    { clave: "EXTRA", valor: "1" },
  ];
  assert.deepEqual(combinarVariables(filas, pegadas), [
    { clave: "SALUDO", valor: "hola", editada: true, nueva: false, oculta: false },
    { clave: "MODO", editada: false, nueva: false },
    { clave: "EXTRA", valor: "1", editada: false, nueva: true },
  ]);
  assert.equal(contarCambios(["SALUDO", "MODO"], combinarVariables(filas, pegadas)), 2);
  assert.equal(totalTrasPegar(filas, pegadas), 3);
  assert.equal(textoResumenPegado(filas, pegadas), "Se agregan 1 nueva y se reemplazan 1");
  assert.equal(textoResumenPegado(filas, [{ clave: "X", valor: "" }, { clave: "Y", valor: "" }]), "Se agregan 2 nuevas");
});

test("17 · Pegar .env avisa cuando se pasaría del tope", () => {
  const pegadas = Array.from({ length: MAXIMO_VARIABLES + 1 }, (_, i) => ({ clave: `V_${i}`, valor: "x" }));
  assert.equal(totalTrasPegar([], pegadas) > MAXIMO_VARIABLES, true);
});
