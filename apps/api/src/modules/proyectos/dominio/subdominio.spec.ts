<<<<<<< HEAD
/// <reference types="jest" />
import { subdominioDesdeNombre } from "./subdominio";
import { DatosAltaInvalidos } from "./errores";

describe("subdominioDesdeNombre", () => {
  it("Mi App Web", () => {
    expect(subdominioDesdeNombre("Mi App Web")).toBe("mi-app-web");
  });

  it("acentos", () => {
    expect(subdominioDesdeNombre("Café & Bar!")).toBe("cafe-bar");
  });

  it("guiones al borde", () => {
    expect(subdominioDesdeNombre("---Hola---Mundo---")).toBe("hola-mundo");
  });

  it("vacío", () => {
    expect(() => subdominioDesdeNombre("!@#$%")).toThrow(DatosAltaInvalidos);
  });

  it("más de 63", () => {
    const largo = "a".repeat(70);
    expect(subdominioDesdeNombre(largo).length).toBeLessThanOrEqual(63);
  });
});
=======
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
>>>>>>> origin/main
