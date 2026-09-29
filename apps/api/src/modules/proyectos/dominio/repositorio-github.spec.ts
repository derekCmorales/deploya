import { UrlRepositorioInvalida } from "./errores";
import { repositorioDesdeUrl } from "./repositorio-github";

describe("repositorioDesdeUrl", () => {
  it("normaliza la URL de un repositorio público de GitHub", () => {
    expect(repositorioDesdeUrl("https://github.com/derekCmorales/hola-deploya")).toEqual({
      dueno: "derekCmorales",
      nombre: "hola-deploya",
      url: "https://github.com/derekCmorales/hola-deploya",
    });
  });

  it.each(["https://github.com/a/b.git", "https://github.com/a/b/", "https://github.com/a/b.git/", "  https://github.com/a/b  "])(
    "acepta %p y lo deja en https://github.com/a/b",
    (url) => {
      expect(repositorioDesdeUrl(url).url).toBe("https://github.com/a/b");
    },
  );

  it.each([
    "https://gitlab.com/a/b",
    "http://github.com/a/b",
    "https://github.com/a",
    "https://github.com/a/b/tree/main",
    "https://notgithub.com/a/b",
    "",
  ])("URL que no es de GitHub: rechaza %p", (url) => {
    expect(() => repositorioDesdeUrl(url)).toThrow(UrlRepositorioInvalida);
  });
});
