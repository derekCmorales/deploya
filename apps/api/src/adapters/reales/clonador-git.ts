import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { ClonFallido, DespliegueCancelado } from "../../modules/construccion/dominio/errores";
import {
  ClonadorRepositorioPuerto,
  type ClonListo,
  type SolicitudClon,
} from "../../modules/construccion/puertos/clonador-repositorio.puerto";
import type { LectorFuente } from "../../modules/construccion/puertos/lector-fuente.puerto";
import { LectorFuenteLocal } from "./lector-fuente-local";

const URL_PUBLICA = /^https:\/\/[\w.-]+\/[\w.-]+\/[\w.-]+(\.git)?\/?$/;
const TIEMPO_MAXIMO_CLON_MS = 2 * 60 * 1000;
const SEPARADOR = "\u001f";
const LARGO_MAXIMO_ERROR = 4000;

/**
 * `git clone --depth 1` con `spawn` (sin shell, argumentos como lista). Solo URLs
 * https públicas: nada de `file://`, `ssh` ni opciones disfrazadas de URL.
 */
export class ClonadorGit extends ClonadorRepositorioPuerto {
  constructor(
    private readonly directorioTrabajo: string,
    private readonly ejecutable: string = "git",
  ) {
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

  /**
   * `git` en su propio grupo de procesos: al cancelar o vencer el tiempo se mata el grupo entero, porque
   * `git clone` deja vivos a sus ayudantes (`git-remote-https`) si solo se mata el proceso padre.
   */
  private git(argumentos: string[], senal?: AbortSignal): Promise<string> {
    return new Promise((resolver, rechazar) => {
      const hijo = spawn(this.ejecutable, argumentos, {
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
      });
      let salida = "";
      let errores = "";
      let vencido = false;
      const matarGrupo = () => {
        try {
          if (hijo.pid) process.kill(-hijo.pid, "SIGKILL");
        } catch {
          // El grupo ya terminó: no hay nada que matar.
        }
      };
      const temporizador = setTimeout(() => {
        vencido = true;
        matarGrupo();
      }, TIEMPO_MAXIMO_CLON_MS);
      senal?.addEventListener("abort", matarGrupo, { once: true });
      const cerrar = () => {
        clearTimeout(temporizador);
        senal?.removeEventListener("abort", matarGrupo);
      };
      hijo.stdout.on("data", (trozo: Buffer) => (salida += trozo.toString()));
      hijo.stderr.on("data", (trozo: Buffer) => (errores = (errores + trozo.toString()).slice(-LARGO_MAXIMO_ERROR)));
      hijo.on("error", (error) => {
        cerrar();
        rechazar(new ClonFallido(error.message));
      });
      hijo.on("close", (codigo) => {
        cerrar();
        if (senal?.aborted) return rechazar(new DespliegueCancelado());
        if (vencido) return rechazar(new ClonFallido("git no terminó a tiempo"));
        if (codigo === 0) return resolver(salida);
        const detalle = errores.trim().split("\n").at(-1) || `git terminó con código ${codigo}`;
        rechazar(new ClonFallido(detalle));
      });
    });
  }
}
