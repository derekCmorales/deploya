import { DatosAltaInvalidos } from "./errores";
import { esSubdominioReservado, SUBDOMINIOS_DE_PLATAFORMA, subdominioDesdeNombre } from "./subdominio";

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

describe("esSubdominioReservado (M6-02)", () => {
  it.each(["api", "www", "web", "admin", "mail", "traefik"])("%s lo usa la plataforma en el VPS", (subdominio) => {
    expect(esSubdominioReservado(subdominio, SUBDOMINIOS_DE_PLATAFORMA)).toBe(true);
  });

  it("un nombre normal o uno que solo contiene el reservado no lo es", () => {
    expect(esSubdominioReservado("hola-deploya", SUBDOMINIOS_DE_PLATAFORMA)).toBe(false);
    expect(esSubdominioReservado("api-tienda", SUBDOMINIOS_DE_PLATAFORMA)).toBe(false);
    expect(esSubdominioReservado(subdominioDesdeNombre("API"), SUBDOMINIOS_DE_PLATAFORMA)).toBe(true);
  });

  it("sin reservados (desarrollo) ningún nombre lo es", () => {
    expect(esSubdominioReservado("api", [])).toBe(false);
  });
});
