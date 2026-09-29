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