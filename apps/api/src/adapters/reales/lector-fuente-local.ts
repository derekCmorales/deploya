import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { LectorFuente } from "../../modules/construccion/puertos/lector-fuente.puerto";

export type LeerArchivo = (ruta: string, codificacion: "utf8") => Promise<string>;

const SIN_ARCHIVO = new Set(["ENOENT", "EISDIR", "ENOTDIR"]);

/** Lee archivos del clon en el trabajador. Nunca sale del directorio del clon. */
export class LectorFuenteLocal extends LectorFuente {
  constructor(
    private readonly directorio: string,
    private readonly leerArchivo: LeerArchivo = readFile,
  ) {
    super();
  }

  async existe(ruta: string): Promise<boolean> {
    return (await this.leer(ruta)) !== null;
  }

  async leer(ruta: string): Promise<string | null> {
    const destino = resolve(this.directorio, ruta);
    if (relative(this.directorio, destino).startsWith("..")) return null;
    try {
      return await this.leerArchivo(destino, "utf8");
    } catch (error) {
      if (SIN_ARCHIVO.has((error as NodeJS.ErrnoException).code ?? "")) return null;
      throw error;
    }
  }
}
