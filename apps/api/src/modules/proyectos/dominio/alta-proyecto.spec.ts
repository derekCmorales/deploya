import { validarAltaProyecto, validarConsultaRepositorio } from "./alta-proyecto";
import { DatosAltaInvalidos, UrlRepositorioInvalida } from "./errores";

const URL = "https://github.com/derekCmorales/hola-deploya";

describe("validarAltaProyecto", () => {
  it("devuelve el alta con la URL normalizada y la rama main por defecto", () => {
    expect(validarAltaProyecto({ url: `${URL}.git`, nombre: " hola ", puerto: "3000" })).toEqual({
      url: URL,
      rama: "main",
      nombre: "hola",
      puerto: 3000,
    });
  });

  it("sin puerto deja que el servicio use el de EXPOSE", () => {
    expect(validarAltaProyecto({ url: URL, rama: "develop", nombre: "hola" })).toEqual({ url: URL, rama: "develop", nombre: "hola" });
  });

  it.each([null, "texto", 42])("rechaza un cuerpo %p", (cuerpo) => {
    expect(() => validarAltaProyecto(cuerpo)).toThrow(DatosAltaInvalidos);
  });

  it("rechaza el alta sin nombre", () => {
    expect(() => validarAltaProyecto({ url: URL, nombre: "  " })).toThrow(DatosAltaInvalidos);
  });

  it.each([0, 65536, 80.5, "abc"])("rechaza el puerto %p", (puerto) => {
    expect(() => validarAltaProyecto({ url: URL, nombre: "hola", puerto })).toThrow(DatosAltaInvalidos);
  });

  it("rechaza una URL que no es de GitHub", () => {
    expect(() => validarAltaProyecto({ url: "https://gitlab.com/a/b", nombre: "hola" })).toThrow(UrlRepositorioInvalida);
  });
});

describe("validarConsultaRepositorio", () => {
  it("normaliza la URL y usa main si no llega rama", () => {
    expect(validarConsultaRepositorio({ url: `${URL}/` })).toEqual({ url: URL, rama: "main" });
  });

  it("sin URL rechaza con UrlRepositorioInvalida", () => {
    expect(() => validarConsultaRepositorio({})).toThrow(UrlRepositorioInvalida);
  });
});
