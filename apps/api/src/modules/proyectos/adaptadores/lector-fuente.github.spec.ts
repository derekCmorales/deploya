import { FuenteNoDisponible } from "../dominio/errores";
import type { ClienteHttp } from "./cliente-github";
import { LectorFuenteGitHub } from "./lector-fuente.github";

const REPO = { dueno: "derekCmorales", nombre: "hola-deploya", url: "https://github.com/derekCmorales/hola-deploya" };

function httpDe(cuerpo: unknown, estado = 200): ClienteHttp {
  return async () => new Response(typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo), { status: estado });
}

describe("LectorFuenteGitHub", () => {
  const lector = (http: ClienteHttp) => new LectorFuenteGitHub(http, undefined, "https://api.github.com", REPO, "main");

  it("lee un archivo en base64", async () => {
    const http = httpDe({ type: "file", content: Buffer.from('{"scripts":{"start":"node ."}}', "utf8").toString("base64") });
    await expect(lector(http).leer("package.json")).resolves.toContain("node .");
  });

  it("un archivo que no existe devuelve null", async () => {
    await expect(lector(httpDe({}, 404)).leer("Dockerfile")).resolves.toBeNull();
    await expect(lector(httpDe({}, 404)).existe("Dockerfile")).resolves.toBe(false);
  });

  it("el límite de GitHub no se disfraza de archivo ausente", async () => {
    const http: ClienteHttp = async () => new Response("", { status: 403, headers: { "x-ratelimit-remaining": "0" } });
    await expect(lector(http).leer("package.json")).rejects.toThrow(FuenteNoDisponible);
  });
});
