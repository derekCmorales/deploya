import { execFile } from "node:child_process";
import { access, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { ClonFallido } from "../../modules/construccion/dominio/errores";
import {
  ClonadorRepositorioPuerto,
  type ClonListo,
  type SolicitudClon,
} from "../../modules/construccion/puertos/clonador-repositorio.puerto";

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
    await this.git(["clone", "--depth", "1", "--branch", solicitud.rama, "--", solicitud.url, directorio]);
    if (solicitud.commitSha) await this.fijarCommit(directorio, solicitud.commitSha);
    const salida = await this.git(["-C", directorio, "log", "-1", `--format=%H${SEPARADOR}%s${SEPARADOR}%an`]);
    const [sha, mensaje, autor] = salida.trim().split(SEPARADOR);
    return { directorio, commit: { sha, mensaje, autor } };
  }

  async existeArchivo(directorio: string, ruta: string): Promise<boolean> {
    try {
      await access(join(directorio, ruta));
      return true;
    } catch {
      return false;
    }
  }

  async limpiar(directorio: string): Promise<void> {
    await rm(directorio, { recursive: true, force: true });
  }

  private async fijarCommit(directorio: string, commitSha: string): Promise<void> {
    await this.git(["-C", directorio, "fetch", "--depth", "1", "origin", commitSha]);
    await this.git(["-C", directorio, "checkout", "--quiet", commitSha]);
  }

  private async git(argumentos: string[]): Promise<string> {
    try {
      const { stdout } = await ejecutar("git", argumentos, {
        timeout: TIEMPO_MAXIMO_CLON_MS,
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
      });
      return stdout;
    } catch (error) {
      const detalle = (error as { stderr?: string }).stderr?.trim() || (error as Error).message;
      throw new ClonFallido(detalle.split("\n").at(-1) ?? detalle);
    }
  }
}
