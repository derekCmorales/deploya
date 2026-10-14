import { cambiosProyectoDe } from "./cambios-proyecto";
import { DatosAltaInvalidos, PuertoInvalido, RutaInvalida, UrlRepositorioInvalida } from "./errores";

describe("CambiosProyecto (M3-04)", () => {
  it("solo lleva lo que vino en el cuerpo", () => {
    expect(cambiosProyectoDe({ rama: "sin-dockerfile" })).toEqual({ rama: "sin-dockerfile" });
    expect(cambiosProyectoDe({ nombre: " Hola demo ", puertoInterno: "3000" })).toEqual({ nombre: "Hola demo", puertoInterno: 3000 });
  });

  it("el subdominio y los campos desconocidos se ignoran", () => {
    expect(cambiosProyectoDe({ nombre: "Otro", subdominio: "robado", usuarioId: "u-2" })).toEqual({ nombre: "Otro" });
  });

  it("sin cambios o sin cuerpo se rechaza", () => {
    expect(() => cambiosProyectoDe({})).toThrow("No hay cambios que guardar.");
    expect(() => cambiosProyectoDe({ subdominio: "x" })).toThrow(DatosAltaInvalidos);
    expect(() => cambiosProyectoDe(undefined)).toThrow(DatosAltaInvalidos);
    expect(() => cambiosProyectoDe("texto")).toThrow(DatosAltaInvalidos);
  });

  describe("nombre", () => {
    it("admite de 1 a 64 caracteres", () => {
      expect(cambiosProyectoDe({ nombre: "a" })).toEqual({ nombre: "a" });
      expect(cambiosProyectoDe({ nombre: "a".repeat(64) })).toEqual({ nombre: "a".repeat(64) });
      expect(() => cambiosProyectoDe({ nombre: "a".repeat(65) })).toThrow(DatosAltaInvalidos);
      expect(() => cambiosProyectoDe({ nombre: "   " })).toThrow(DatosAltaInvalidos);
      expect(() => cambiosProyectoDe({ nombre: 12 })).toThrow(DatosAltaInvalidos);
    });
  });

  describe("urlRepositorio", () => {
    it("usa la misma regla del alta: https de GitHub, normalizada", () => {
      expect(cambiosProyectoDe({ urlRepositorio: "https://github.com/derekCmorales/hola-deploya.git/" })).toEqual({
        urlRepositorio: "https://github.com/derekCmorales/hola-deploya",
      });
      expect(() => cambiosProyectoDe({ urlRepositorio: "https://gitlab.com/a/b" })).toThrow(UrlRepositorioInvalida);
      expect(() => cambiosProyectoDe({ urlRepositorio: "" })).toThrow(UrlRepositorioInvalida);
    });
  });

  describe("rama", () => {
    it("una rama vacía vuelve a main", () => {
      expect(cambiosProyectoDe({ rama: "  " })).toEqual({ rama: "main" });
    });
  });

  describe("rutaDockerfile", () => {
    it.each([
      ["Dockerfile", "Dockerfile"],
      ["/Dockerfile", "Dockerfile"],
      ["./Dockerfile", "Dockerfile"],
      ["docker/Dockerfile.prod", "docker/Dockerfile.prod"],
    ])("%s se guarda como %s", (entrada, esperada) => {
      expect(cambiosProyectoDe({ rutaDockerfile: entrada })).toEqual({ rutaDockerfile: esperada });
    });

    it.each(["", "../Dockerfile", "a/../../b", "a//b", "docker/", "a\\b", "x\0y", "/"])("%j sale de la regla: RutaInvalida", (ruta) => {
      expect(() => cambiosProyectoDe({ rutaDockerfile: ruta })).toThrow(RutaInvalida);
    });
  });

  describe("puertoInterno", () => {
    it("admite de 1 a 65535", () => {
      expect(cambiosProyectoDe({ puertoInterno: 1 })).toEqual({ puertoInterno: 1 });
      expect(cambiosProyectoDe({ puertoInterno: 65535 })).toEqual({ puertoInterno: 65535 });
    });

    it.each([0, 65536, -1, 80.5, "abc", "", null, true])("%j es PuertoInvalido", (puerto) => {
      expect(() => cambiosProyectoDe({ puertoInterno: puerto })).toThrow(PuertoInvalido);
    });
  });
});
