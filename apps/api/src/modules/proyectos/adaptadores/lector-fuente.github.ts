import { FuenteNoDisponible, RepositorioNoAccesible } from "../dominio/errores";
import type { RepositorioGitHub } from "../dominio/repositorio-github";
import { LectorFuente } from "../../construccion/puertos/lector-fuente.puerto";
import type { ClienteHttp } from "./cliente-github";

const HTTP_NO_ENCONTRADO = 404;
const HTTP_ERROR_SERVIDOR = 500;

interface ContenidoGitHub {
  type: string;
  content?: string;
  download_url?: string | null;
}

/** `LectorFuente` sobre la API de contenidos de GitHub. `null` si el archivo no está. */
export class LectorFuenteGitHub extends LectorFuente {
  constructor(
    private readonly http: ClienteHttp,
    private readonly token: string | undefined,
    private readonly api: string,
    private readonly repositorio: RepositorioGitHub,
    private readonly rama: string,
  ) {
    super();
  }

  async existe(ruta: string): Promise<boolean> {
    return (await this.leer(ruta)) !== null;
  }

  async leer(ruta: string): Promise<string | null> {
    const url = this.urlDe(ruta);
    const respuesta = await this.pedir(url);
    if (respuesta.status === HTTP_NO_ENCONTRADO) return null;
    return this.texto(await this.exigir(respuesta));
  }

  private urlDe(ruta: string): string {
    const camino = ruta.split("/").map(encodeURIComponent).join("/");
    const base = `${this.api}/repos/${this.repositorio.dueno}/${this.repositorio.nombre}`;
    return `${base}/contents/${camino}?ref=${encodeURIComponent(this.rama)}`;
  }

  private async texto(respuesta: Response): Promise<string | null> {
    const cuerpo = (await respuesta.json()) as ContenidoGitHub | unknown[];
    if (Array.isArray(cuerpo) || cuerpo.type !== "file") return null;
    if (cuerpo.content) return Buffer.from(cuerpo.content, "base64").toString("utf8");
    if (!cuerpo.download_url) return null;
    return (await this.exigir(await this.pedir(cuerpo.download_url))).text();
  }

  private pedir(url: string): Promise<Response> {
    const cabeceras: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "deploya" };
    if (this.token) cabeceras.Authorization = `Bearer ${this.token}`;
    return this.http(url, { headers: cabeceras }).catch(() => {
      throw new FuenteNoDisponible();
    });
  }

  private async exigir(respuesta: Response): Promise<Response> {
    if (respuesta.ok) return respuesta;
    if (respuesta.headers.get("x-ratelimit-remaining") === "0" || respuesta.status >= HTTP_ERROR_SERVIDOR) {
      throw new FuenteNoDisponible();
    }
    throw new RepositorioNoAccesible(respuesta.status);
  }
}
