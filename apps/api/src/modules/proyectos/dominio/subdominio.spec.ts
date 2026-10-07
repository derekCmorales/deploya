import { DatosAltaInvalidos } from "./errores";
import { subdominioDesdeNombre } from "./subdominio";

describe("subdominioDesdeNombre", () => {
  it("Subdominio desde el nombre: «Mi App Web» → mi-app-web", () => {
    expect(subdominioDesdeNombre("Mi App Web")).toBe("mi-app-web");
  });

  it("quita acentos y símbolos", () => {
    expect(subdominioDesdeNombre("Café & Bar!")).toBe("cafe-bar");
  });

  it("sin guiones al inicio ni al final", () => {
    expect(subdominioDesdeNombre("---Hola___Mundo---")).toBe("hola-mundo");
  });

  it("recorta a 63 caracteres sin dejar un guion al final", () => {
    const etiqueta = subdominioDesdeNombre(`${"a".repeat(62)} b`);
    expect(etiqueta).toBe("a".repeat(62));
    expect(subdominioDesdeNombre("x".repeat(70))).toHaveLength(63);
  });

  it("un nombre sin letras ni números lanza DatosAltaInvalidos", () => {
    expect(() => subdominioDesdeNombre("!@#$%")).toThrow(DatosAltaInvalidos);
  });
});
