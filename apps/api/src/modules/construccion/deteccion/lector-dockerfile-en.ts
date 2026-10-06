import { LectorFuente } from "../puertos/lector-fuente.puerto";
import { RUTA_DOCKERFILE } from "./deteccion.constantes";

/**
 * Decorator: las recetas siempre piden `Dockerfile`; este lector lo busca en la
 * `rutaDockerfile` del proyecto y deja pasar el resto de las lecturas.
 */
export class LectorDockerfileEn extends LectorFuente {
  constructor(
    private readonly fuente: LectorFuente,
    private readonly rutaDockerfile: string,
  ) {
    super();
  }

  existe(ruta: string): Promise<boolean> {
    return this.fuente.existe(this.redirigir(ruta));
  }

  leer(ruta: string): Promise<string | null> {
    return this.fuente.leer(this.redirigir(ruta));
  }

  private redirigir(ruta: string): string {
    return ruta === RUTA_DOCKERFILE ? this.rutaDockerfile : ruta;
  }
}
