import { Injectable } from "@nestjs/common";
import { ProveedorFuente } from "../puertos/proveedor-fuente.puerto";
import { ValidacionRepositorio, CommitFuente } from "../dominio/proyecto";
import { 
  RepositorioNoAccesible, 
  RamaNoEncontrada, 
  RepositorioSinDockerfile, 
  FuenteNoDisponible, 
  UrlRepositorioInvalida 
} from "../dominio/errores";
import { puertoDesdeExpose } from "../dominio/puerto-expose";
import { PUERTO_POR_DEFECTO } from "../dominio/proyectos.constantes";

const TIEMPO_ESPERA_GITHUB_MS = 10000;

@Injectable()
export class FuenteGitHubPublica extends ProveedorFuente {
  constructor(private readonly clienteFetch: typeof fetch = fetch) {
    super();
  }

  async validar(url: string, rama: string): Promise<ValidacionRepositorio> {
    const regex = /^https:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(\.git)?\/?$/;
    const match = url.match(regex);
    if (!match) {
      throw new UrlRepositorioInvalida("URL de repositorio no válida.");
    }

    const duenio = match[1];
    const repo = match[2];
    const urlNormalizada = `https://github.com/${duenio}/${repo}`;

    const cabeceras: Record<string, string> = {
      "Accept": "application/vnd.github+json",
      "User-Agent": "deploya",
    };

    if (process.env.GITHUB_TOKEN) {
      cabeceras["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const opciones: RequestInit = {
      headers: cabeceras,
      signal: AbortSignal.timeout(TIEMPO_ESPERA_GITHUB_MS),
    };

    try {
      const respRepo = await this.clienteFetch(`https://api.github.com/repos/${duenio}/${repo}`, opciones);
      
      if (respRepo.status === 404 || respRepo.status === 401 || respRepo.status === 403) {
        const remaining = respRepo.headers.get("x-ratelimit-remaining");
        if (remaining === "0") {
          throw new FuenteNoDisponible("Límite de tasa de GitHub excedido.");
        }
        throw new RepositorioNoAccesible(respRepo.status);
      }
      
      if (!respRepo.ok) {
        if (respRepo.status >= 500) {
          throw new FuenteNoDisponible();
        }
        throw new RepositorioNoAccesible(respRepo.status);
      }

      const respRamas = await this.clienteFetch(`https://api.github.com/repos/${duenio}/${repo}/branches?per_page=100`, opciones);
      if (!respRamas.ok) {
        throw new RepositorioNoAccesible(respRamas.status);
      }
      const listaRamasObj = (await respRamas.json()) as Array<{ name: string }>;
      const nombresRamas = listaRamasObj.map((r) => r.name);

      if (!nombresRamas.includes(rama)) {
        throw new RamaNoEncontrada();
      }

      const respCommit = await this.clienteFetch(`https://api.github.com/repos/${duenio}/${repo}/commits/${rama}`, opciones);
      if (!respCommit.ok) {
        throw new RamaNoEncontrada();
      }
      const commitData = (await respCommit.json()) as {
        sha: string;
        commit: { message: string; author: { name: string } };
      };

      const commit: CommitFuente = {
        sha: commitData.sha,
        mensaje: commitData.commit.message,
        autor: commitData.commit.author.name,
      };

      const respContent = await this.clienteFetch(`https://api.github.com/repos/${duenio}/${repo}/contents/Dockerfile?ref=${rama}`, opciones);
      if (respContent.status === 404) {
        throw new RepositorioSinDockerfile(rama);
      }
      if (!respContent.ok) {
        throw new RepositorioSinDockerfile(rama);
      }

      const contenidoObj = (await respContent.json()) as {
        content?: string;
        download_url?: string | null;
      };

      let contenidoDockerfile = "";
      if (contenidoObj.content) {
        contenidoDockerfile = Buffer.from(contenidoObj.content, "base64").toString("utf-8");
      } else if (contenidoObj.download_url) {
        const respDl = await this.clienteFetch(contenidoObj.download_url, opciones);
        if (respDl.ok) {
          contenidoDockerfile = await respDl.text();
        }
      }

      if (!contenidoDockerfile) {
        throw new RepositorioSinDockerfile(rama);
      }

      const puertoEncontrado = puertoDesdeExpose(contenidoDockerfile) ?? PUERTO_POR_DEFECTO;

      return {
        accesible: true,
        urlNormalizada,
        ramas: nombresRamas,
        commit,
        dockerfile: contenidoDockerfile,
        puerto: puertoEncontrado,
      };
    } catch (error) {
      if (
        error instanceof RepositorioNoAccesible ||
        error instanceof RamaNoEncontrada ||
        error instanceof RepositorioSinDockerfile ||
        error instanceof FuenteNoDisponible ||
        error instanceof UrlRepositorioInvalida
      ) {
        throw error;
      }
      throw new FuenteNoDisponible("Error de conexión con la fuente externa.");
    }
  }
}