import { execFile } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { promisify } from "node:util";
import { ClonFallido, DespliegueCancelado } from "../../modules/construccion/dominio/errores";
import {
  ClonadorRepositorioPuerto,
  type ClonListo,
  type SolicitudClon,
} from "../../modules/construccion/puertos/clonador-repositorio.puerto";
import type { LectorFuente } from "../../modules/construccion/puertos/lector-fuente.puerto";
import { LectorFuenteLocal } from "./lector-fuente-local";

const ejecutar = promisify(execFile);
const URL_PUBLICA = /^https:\/\/[\w.-]+\/[\w.-]+\/[\w.-]+(\.git)?\/?$/;
const TIEMPO_MAXIMO_CLON_MS = 2 * 60 * 1000;
const SEPARADOR = "\u001f";

/**
 * `git clone --depth 1` con `execFile` (sin shell, argumentos como lista). Solo URLs
 * https públicas: nada de `file://`, `ssh` ni opciones disfrazadas de URL.
 */
export class ClonadorGit extends ClonadorRepositorioPuerto {
  constructor(private readonly directorioTrabajo: string) {
    super();
  }

  async clonar(solicitud: SolicitudClon): Promise<ClonListo> {
    if (!URL_PUBLICA.test(solicitud.url)) throw new ClonFallido("la URL no es un repositorio https público");
    const directorio = join(this.directorioTrabajo, solicitud.despliegueId);
    await mkdir(this.directorioTrabajo, { recursive: true });
    try {
      return await this.clonarYLeer(solicitud, directorio);
    } catch (error) {
      await this.limpiar(directorio);
      throw error;
    }
  }

  lector(directorio: string): LectorFuente {
    return new LectorFuenteLocal(directorio);
  }

  async escribir(directorio: string, ruta: string, contenido: string): Promise<void> {
    const destino = resolve(directorio, ruta);
    if (relative(directorio, destino).startsWith("..")) throw new ClonFallido(`ruta fuera del clon: ${ruta}`);
    await writeFile(destino, contenido, "utf8");
  }

  async limpiar(directorio: string): Promise<void> {
    await rm(directorio, { recursive: true, force: true });
  }

  private async clonarYLeer(solicitud: SolicitudClon, directorio: string): Promise<ClonListo> {
    await this.git(["clone", "--depth", "1", "--branch", solicitud.rama, "--", solicitud.url, directorio], solicitud.senal);
    if (solicitud.commitSha) await this.fijarCommit(directorio, solicitud.commitSha, solicitud.senal);
    const salida = await this.git(["-C", directorio, "log", "-1", `--format=%H${SEPARADOR}%s${SEPARADOR}%an`], solicitud.senal);
    const [sha, mensaje, autor] = salida.trim().split(SEPARADOR);
    return { directorio, commit: { sha, mensaje, autor } };
  }

  private async fijarCommit(directorio: string, commitSha: string, senal?: AbortSignal): Promise<void> {
    await this.git(["-C", directorio, "fetch", "--depth", "1", "origin", commitSha], senal);
    await this.git(["-C", directorio, "checkout", "--quiet", commitSha], senal);
  }

  private async git(argumentos: string[], senal?: AbortSignal): Promise<string> {
    try {
      const { stdout } = await ejecutar("git", argumentos, {
        timeout: TIEMPO_MAXIMO_CLON_MS,
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
        signal: senal,
      });
      return stdout;
    } catch (error) {
      if (senal?.aborted) throw new DespliegueCancelado();
      const detalle = (error as { stderr?: string }).stderr?.trim() || (error as Error).message;
      throw new ClonFallido(detalle.split("\n").at(-1) ?? detalle);
    }
  }
}
