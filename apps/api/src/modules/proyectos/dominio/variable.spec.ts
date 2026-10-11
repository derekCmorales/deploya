import { ClaveInvalida, ClaveReservada, DemasiadasVariables, ValorDemasiadoLargo } from "./errores";
import { ClaveVariable, MAXIMO_BYTES_VALOR, MAXIMO_LARGO_CLAVE, MAXIMO_VARIABLES, validarConjuntoVariables } from "./variable";

describe("ClaveVariable", () => {
  it("Clave inválida", () => {
    expect(() => new ClaveVariable("mi_variable")).toThrow(ClaveInvalida);
    expect(() => new ClaveVariable("MI VARIABLE")).toThrow(ClaveInvalida);
    expect(() => new ClaveVariable("MI-VARIABLE")).toThrow(ClaveInvalida);
    expect(() => new ClaveVariable("")).toThrow(ClaveInvalida);
    expect(() => new ClaveVariable("A".repeat(MAXIMO_LARGO_CLAVE + 1))).toThrow(ClaveInvalida);
    expect(new ClaveVariable("SALUDO").valor).toBe("SALUDO");
  });

  it("PORT es reservada", () => {
    expect(() => new ClaveVariable("PORT")).toThrow(ClaveReservada);
    expect(() => validarConjuntoVariables([{ clave: "PORT", valor: "8080" }])).toThrow(ClaveReservada);
  });

  it("límites de valor y cantidad", () => {
    expect(() => validarConjuntoVariables([{ clave: "SALUDO", valor: "a".repeat(MAXIMO_BYTES_VALOR + 1) }])).toThrow(ValorDemasiadoLargo);
    const demasiadas = Array.from({ length: MAXIMO_VARIABLES + 1 }, (_, i) => ({ clave: `VAR_${i}`, valor: "x" }));
    expect(() => validarConjuntoVariables(demasiadas)).toThrow(DemasiadasVariables);
    expect(() => validarConjuntoVariables([{ clave: "SALUDO", valor: "a" }, { clave: "SALUDO", valor: "b" }])).toThrow(ClaveInvalida);
  });
});
