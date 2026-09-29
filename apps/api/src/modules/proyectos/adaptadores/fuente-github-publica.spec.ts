/// <reference types="jest" />
import { FuenteGitHubPublica } from "./fuente-github-publica";
import { RepositorioNoAccesible, RamaNoEncontrada, RepositorioSinDockerfile, FuenteNoDisponible, UrlRepositorioInvalida } from "../dominio/errores";

describe("FuenteGitHubPublica", () => {
  it("URL de otro host lanza UrlRepositorioInvalida", async () => {
    const fetchMock = jest.fn();
    const fuente = new FuenteGitHubPublica(fetchMock);
    await expect(fuente.validar("https://gitlab.com/duenio/repo", "main")).rejects.toThrow(UrlRepositorioInvalida);
  });

  it("404 de GitHub lanza RepositorioNoAccesible", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: { get: () => "60" },
    });
    const fuente = new FuenteGitHubPublica(fetchMock);
    await expect(fuente.validar("https://github.com/duenio/repo", "main")).rejects.toThrow(RepositorioNoAccesible);
  });

  it("rama inexistente lanza RamaNoEncontrada", async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ 
        ok: true, 
        status: 200, 
        json: async () => [{ name: "main" }] 
      });
    const fuente = new FuenteGitHubPublica(fetchMock);
    await expect(fuente.validar("https://github.com/duenio/repo", "inexistente")).rejects.toThrow(RamaNoEncontrada);
  });
});