import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { EstadoScriptsPuerto, type EstadoRespaldo, type EstadoVersion } from "../puertos/estado-scripts.puerto";

/** Lo que fija `respaldar.sh` (contrato instalacion.md): diario a las 03:00, guarda 7. */
export const PROGRAMA_POR_DEFECTO = { programa: "diario", hora: "03:00", conserva: 7 } as const;

type Json = Record<string, unknown>;

const texto = (valor: unknown): string | null => (typeof valor === "string" && valor ? valor : null);
const numero = (valor: unknown): number | null => (typeof valor === "number" ? valor : null);

/**
 * Lee `ultimo.json`, `programa.json` y `version.json` del directorio de respaldos (montado de solo
 * lectura en la API). Un archivo que falta o no es JSON cuenta como vacío: la 32 dice «sin respaldos».
 */
export class EstadoScriptsArchivos extends EstadoScriptsPuerto {
  constructor(private readonly directorio: string) {
    super();
  }

  async respaldo(): Promise<EstadoRespaldo> {
    const [ultimo, programa] = await Promise.all([this.leer("ultimo.json"), this.leer("programa.json")]);
    const fecha = texto(ultimo.ultimo);
    return {
      ultimo: fecha ? new Date(fecha) : null,
      tamanoMb: numero(ultimo.tamanoMb),
      ruta: this.directorio,
      programa: texto(programa.programa) ?? PROGRAMA_POR_DEFECTO.programa,
      hora: texto(programa.hora) ?? PROGRAMA_POR_DEFECTO.hora,
      conserva: numero(programa.conserva) ?? PROGRAMA_POR_DEFECTO.conserva,
    };
  }

  async version(): Promise<EstadoVersion> {
    const version = await this.leer("version.json");
    return { instalada: texto(version.instalada), disponible: texto(version.disponible) };
  }

  private async leer(archivo: string): Promise<Json> {
    try {
      return JSON.parse(await readFile(join(this.directorio, archivo), "utf8")) as Json;
    } catch {
      return {};
    }
  }
}
