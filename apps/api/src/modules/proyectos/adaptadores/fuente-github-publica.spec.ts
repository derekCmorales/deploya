import {
  FuenteNoDisponible,
  RamaNoEncontrada,
  RepositorioNoAccesible,
  RepositorioSinDockerfile,
  UrlRepositorioInvalida,
} from "../dominio/errores";
import { FuenteGitHubPublica, type ClienteHttp } from "./fuente-github-publica";

const BASE = "https://api.github.com/repos/derekCmorales/hola-deploya";
const DOCKERFILE = "FROM node:20-alpine\nEXPOSE 3000\nCMD [\"node\", \"server.js\"]";

interface Simulada {
  estado?: number;
  cuerpo?: unknown;
  cabeceras?: Record<string, string>;
}

function respuesta({ estado = 200, cuerpo = {}, cabeceras = {} }: Simulada = {}): Response {
  const texto = typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo);
  return new Response(texto, { status: estado, headers: cabeceras });
}

/** GitHub falso: responde por prefijo de URL y registra lo que se pidió. */
function github(rutas: Record<string, Simulada | Error>) {
  const pedidas: { url: string; opciones: RequestInit }[] = [];
  const http: ClienteHttp = async (url, opciones) => {
    pedidas.push({ url, opciones });
    const clave = Object.keys(rutas)
      .filter((r) => url.startsWith(r))
      .sort((a, b) => b.length - a.length)[0];
    const simulada = clave ? rutas[clave] : { estado: 404 };
    if (simulada instanceof Error) throw simulada;
    return respuesta(simulada);
  };
  return { http, pedidas };
}

const VALIDO: Record<string, Simulada> = {
  [BASE]: {},
  [`${BASE}/branches`]: { cuerpo: [{ name: "main" }, { name: "roto" }] },
  [`${BASE}/commits/main`]: {
    cuerpo: { sha: "a1b2c3d4", commit: { message: "feat: hola\n\ncuerpo", author: { name: "Derek", date: "2026-09-29T10:00:00Z" } } },
  },
  [`${BASE}/contents/Dockerfile`]: { cuerpo: { type: "file", content: Buffer.from(DOCKERFILE).toString("base64") } },
};

const consulta = (rama = "main") => ({ url: "https://github.com/derekCmorales/hola-deploya", rama });

describe("FuenteGitHubPublica", () => {
  it("Repositorio válido: devuelve ramas, último commit, Dockerfile y el puerto de EXPOSE", async () => {
    const { http } = github(VALIDO);
    await expect(new FuenteGitHubPublica(http).validar(consulta())).resolves.toEqual({
      accesible: true,
      urlNormalizada: "https://github.com/derekCmorales/hola-deploya",
      repositorio: "derekCmorales/hola-deploya",
      rama: "main",
      ramas: ["main", "roto"],
      commit: { sha: "a1b2c3d4", mensaje: "feat: hola", autor: "Derek", fecha: "2026-09-29T10:00:00Z" },
      dockerfile: DOCKERFILE,
      puerto: 3000,
    });
  });

  it("sin EXPOSE propone el puerto 8080", async () => {
    const { http } = github({
      ...VALIDO,
      [`${BASE}/contents/Dockerfile`]: { cuerpo: { type: "file", content: Buffer.from("FROM nginx").toString("base64") } },
    });
    await expect(new FuenteGitHubPublica(http).validar(consulta())).resolves.toMatchObject({ puerto: 8080 });
  });

  it("Repositorio no accesible: 404 de GitHub lanza RepositorioNoAccesible con el código recibido", async () => {
    const { http } = github({ [BASE]: { estado: 404 } });
    const error = await new FuenteGitHubPublica(http).validar(consulta()).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RepositorioNoAccesible);
    expect(error).toMatchObject({ estadoHttp: 404 });
  });

  it("Rama inexistente: lanza RamaNoEncontrada", async () => {
    const { http } = github({ ...VALIDO, [`${BASE}/commits/`]: { estado: 422 } });
    await expect(new FuenteGitHubPublica(http).validar(consulta("no-existe"))).rejects.toThrow(RamaNoEncontrada);
  });

  it("Falta el Dockerfile: lanza RepositorioSinDockerfile con la rama", async () => {
    const { http } = github({ ...VALIDO, [`${BASE}/contents/Dockerfile`]: { estado: 404 } });
    const error = await new FuenteGitHubPublica(http).validar(consulta()).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RepositorioSinDockerfile);
    expect(error).toMatchObject({ rama: "main" });
  });

  it("un directorio llamado Dockerfile cuenta como falta de Dockerfile", async () => {
    const { http } = github({ ...VALIDO, [`${BASE}/contents/Dockerfile`]: { cuerpo: [{ name: "x" }] } });
    await expect(new FuenteGitHubPublica(http).validar(consulta())).rejects.toThrow(RepositorioSinDockerfile);
  });

  it("un Dockerfile de más de 1 MB se baja por download_url", async () => {
    const crudo = "https://raw.githubusercontent.com/derekCmorales/hola-deploya/main/Dockerfile";
    const { http } = github({
      ...VALIDO,
      [`${BASE}/contents/Dockerfile`]: { cuerpo: { type: "file", content: "", download_url: crudo } },
      [crudo]: { cuerpo: "FROM node\nEXPOSE 4000" },
    });
    await expect(new FuenteGitHubPublica(http).validar(consulta())).resolves.toMatchObject({ puerto: 4000 });
  });

  it("límite de peticiones agotado lanza FuenteNoDisponible, no «no accesible»", async () => {
    const { http } = github({ [BASE]: { estado: 403, cabeceras: { "x-ratelimit-remaining": "0" } } });
    await expect(new FuenteGitHubPublica(http).validar(consulta())).rejects.toThrow(FuenteNoDisponible);
  });

  it("GitHub caído o sin red lanza FuenteNoDisponible", async () => {
    await expect(new FuenteGitHubPublica(github({ [BASE]: { estado: 502 } }).http).validar(consulta())).rejects.toThrow(
      FuenteNoDisponible,
    );
    await expect(new FuenteGitHubPublica(github({ [BASE]: new Error("sin red") }).http).validar(consulta())).rejects.toThrow(
      FuenteNoDisponible,
    );
  });

  it("URL que no es de GitHub: rechaza sin llamar a la red", async () => {
    const { http, pedidas } = github(VALIDO);
    await expect(new FuenteGitHubPublica(http).validar({ url: "https://gitlab.com/a/b", rama: "main" })).rejects.toThrow(
      UrlRepositorioInvalida,
    );
    expect(pedidas).toHaveLength(0);
  });

  it("usa otra URL base de la API si se configura (GitHub Enterprise o un doble local)", async () => {
    const otra = "http://localhost:4010";
    const rutas = Object.fromEntries(Object.entries(VALIDO).map(([ruta, r]) => [ruta.replace("https://api.github.com", otra), r]));
    const { http, pedidas } = github(rutas);
    await expect(new FuenteGitHubPublica(http, undefined, otra).validar(consulta())).resolves.toMatchObject({ puerto: 3000 });
    expect(pedidas[0].url).toBe(`${otra}/repos/derekCmorales/hola-deploya`);
  });

  it("manda el token solo si está configurado", async () => {
    const conToken = github(VALIDO);
    await new FuenteGitHubPublica(conToken.http, "t0k3n").validar(consulta());
    expect(conToken.pedidas[0].opciones.headers).toMatchObject({ Authorization: "Bearer t0k3n", "User-Agent": "deploya" });
    const sinToken = github(VALIDO);
    await new FuenteGitHubPublica(sinToken.http).validar(consulta());
    expect(sinToken.pedidas[0].opciones.headers).not.toHaveProperty("Authorization");
  });
});
