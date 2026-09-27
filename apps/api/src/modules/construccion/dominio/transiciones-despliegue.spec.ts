import { TransicionInvalida } from "./errores";
import type { EstadoDespliegue } from "./estados";
import { puedeTransicionar, transicionar } from "./transiciones-despliegue";

describe("TransicionesDespliegue", () => {
  it("Transición válida: Construyendo registra su artefacto y pasa a Aprovisionando", () => {
    expect(transicionar("construyendo", "aprovisionando")).toBe("aprovisionando");
  });

  it("Transición inválida: Fallido no puede pasar a Saludable", () => {
    expect(() => transicionar("fallido", "saludable")).toThrow(TransicionInvalida);
  });

  const validas: [EstadoDespliegue, EstadoDespliegue][] = [
    ["encolado", "construyendo"],
    ["encolado", "cancelado"],
    ["construyendo", "aprovisionando"],
    ["construyendo", "fallido"],
    ["construyendo", "cancelado"],
    ["revirtiendo", "aprovisionando"],
    ["revirtiendo", "fallido"],
    ["aprovisionando", "publicando"],
    ["aprovisionando", "fallido"],
    ["publicando", "saludable"],
    ["publicando", "fallido"],
    ["saludable", "detenido"],
    ["detenido", "aprovisionando"],
  ];
  it.each(validas)("permite %s → %s (diagrama de estados)", (de, a) => {
    expect(puedeTransicionar(de, a)).toBe(true);
  });

  const invalidas: [EstadoDespliegue, EstadoDespliegue][] = [
    ["encolado", "saludable"],
    ["construyendo", "publicando"],
    ["saludable", "construyendo"],
    ["cancelado", "encolado"],
    ["fallido", "encolado"],
  ];
  it.each(invalidas)("rechaza %s → %s", (de, a) => {
    expect(puedeTransicionar(de, a)).toBe(false);
  });
});
