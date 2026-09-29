import { FuenteNoDisponible, RamaNoEncontrada, RepositorioNoAccesible, RepositorioSinDockerfile } from "../dominio/errores";
import type { CommitFuente, ConsultaRepositorio, ValidacionRepositorio } from "../dominio/proyecto";
import { PUERTO_POR_DEFECTO, RUTA_DOCKERFILE } from "../dominio/proyectos.constantes";
import { puertoDesdeExpose } from "../dominio/puerto-expose";
import { repositorioDesdeUrl } from "../dominio/repositorio-github";
import { ProveedorFuente } from "../puertos/proveedor-fuente.puerto";

export type ClienteHttp = (url: string, opciones: RequestInit) => Promise<Response>;

const API_GITHUB = "https://api.github.com";
const TIEMPO_ESPERA_GITHUB_MS = 10_000;
const RAMAS_POR_PAGINA = 100;
const HTTP_NO_ENCONTRADO = 404;
const HTTP_NO_PROCESABLE = 422;
const HTTP_ERROR_SERVIDOR = 500;

interface CommitGitHub {
  sha: string;
  commit: { message: string; author: { name: string; date: string } };
}

interface ContenidoGitHub {
  type: string;
  content?: string;
  download_url?: string | null;
}

/** `ProveedorFuente` sobre la API REST pública de GitHub (repo, ramas, último commit y Dockerfile). */
export class FuenteGitHubPublica extends ProveedorFuente {
  constructor(
    private readonly http: ClienteHttp,
    private readonly token?: string,
  ) {
    super();
  }

  async validar({ url, rama }: ConsultaRepositorio): Promise<ValidacionRepositorio> {
    const repositorio = repositorioDesdeUrl(url);
    const base = `${API_GITHUB}/repos/${repositorio.dueno}/${repositorio.nombre}`;
    await this.exigir(await this.pedir(base));
    const ramas = await this.ramas(base);
    const commit = await this.ultimoCommit(base, rama);
    const dockerfile = await this.dockerfile(base, rama);
    return {
      accesible: true,
      urlNormalizada: repositorio.url,
      repositorio: `${repositorio.dueno}/${repositorio.nombre}`,
      rama,
      ramas,
      commit,
      dockerfile,
      puerto: puertoDesdeExpose(dockerfile) ?? PUERTO_POR_DEFECTO,
    };
  }

  private async ramas(base: string): Promise<string[]> {
    const respuesta = await this.exigir(await this.pedir(`${base}/branches?per_page=${RAMAS_POR_PAGINA}`));
    const ramas = (await respuesta.json()) as { name: string }[];
    return ramas.map((r) => r.name);
  }

  private async ultimoCommit(base: string, rama: string): Promise<CommitFuente> {
    const respuesta = await this.pedir(`${base}/commits/${encodeURIComponent(rama)}`);
    if (respuesta.status === HTTP_NO_ENCONTRADO || respuesta.status === HTTP_NO_PROCESABLE) {
      throw new RamaNoEncontrada(rama);
    }
    const { sha, commit } = (await (await this.exigir(respuesta)).json()) as CommitGitHub;
    return { sha, mensaje: commit.message.split("\n")[0], autor: commit.author.name, fecha: commit.author.date };
  }

  private async dockerfile(base: string, rama: string): Promise<string> {
    const respuesta = await this.pedir(`${base}/contents/${RUTA_DOCKERFILE}?ref=${encodeURIComponent(rama)}`);
    if (respuesta.status === HTTP_NO_ENCONTRADO) throw new RepositorioSinDockerfile(rama);
    const contenido = (await (await this.exigir(respuesta)).json()) as ContenidoGitHub | unknown[];
    if (Array.isArray(contenido) || contenido.type !== "file") throw new RepositorioSinDockerfile(rama);
    if (contenido.content) return Buffer.from(contenido.content, "base64").toString("utf-8");
    // La API omite `content` en archivos de más de 1 MB; se baja crudo.
    if (contenido.download_url) return (await this.exigir(await this.pedir(contenido.download_url))).text();
    throw new RepositorioSinDockerfile(rama);
  }

  private async pedir(url: string): Promise<Response> {
    try {
      return await this.http(url, { headers: this.cabeceras(), signal: AbortSignal.timeout(TIEMPO_ESPERA_GITHUB_MS) });
    } catch {
      throw new FuenteNoDisponible();
    }
  }

  /** Límite de peticiones agotado o GitHub caído → no es culpa del repositorio. */
  private async exigir(respuesta: Response): Promise<Response> {
    if (respuesta.ok) return respuesta;
    const limiteAgotado = respuesta.headers.get("x-ratelimit-remaining") === "0";
    if (limiteAgotado || respuesta.status >= HTTP_ERROR_SERVIDOR) throw new FuenteNoDisponible();
    throw new RepositorioNoAccesible(respuesta.status);
  }

  private cabeceras(): Record<string, string> {
    const cabeceras: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "deploya" };
    if (this.token) cabeceras.Authorization = `Bearer ${this.token}`;
    return cabeceras;
  }
}
