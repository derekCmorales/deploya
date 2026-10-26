import { mkdir, statfs } from "node:fs/promises";
import { freemem, totalmem } from "node:os";
import type Docker from "dockerode";
import { LecturaServidorPuerto, type ReporteServidor } from "../../modules/administracion/instalacion/puertos/reporte-servidor.puerto";

const BYTES_POR_MB = 1024 * 1024;
const BYTES_POR_GB = 1024 * BYTES_POR_MB;
const DECIMALES_GB = 10;
/** Etiqueta que ponen api, web, trabajador y demás servicios de deploya en compose. */
export const PROYECTO_COMPOSE = "com.docker.compose.project";

const redondearGb = (bytes: number) => Math.round((bytes / BYTES_POR_GB) * DECIMALES_GB) / DECIMALES_GB;

/**
 * Solo en el trabajador (ADR 0002): versión de Docker y contenedores de deploya en marcha, disco
 * del directorio de trabajo y memoria del servidor. Si Docker no responde, lo dice sin lanzar.
 * El directorio lo crea el primer clon; en una instalación nueva se crea aquí para poder medirlo.
 */
export class LecturaServidorDocker extends LecturaServidorPuerto {
  constructor(
    private readonly docker: Docker,
    private readonly directorio: string,
    private readonly proyectoCompose: string,
  ) {
    super();
  }

  async medir(): Promise<Omit<ReporteServidor, "tomado">> {
    const [docker, disco] = await Promise.all([this.leerDocker(), this.leerDisco()]);
    const totalBytes = disco.blocks * disco.bsize;
    return {
      ...docker,
      disco: { usadoGb: redondearGb(totalBytes - disco.bavail * disco.bsize), totalGb: redondearGb(totalBytes) },
      memoria: { libreMb: Math.round(freemem() / BYTES_POR_MB), totalMb: Math.round(totalmem() / BYTES_POR_MB) },
    };
  }

  private async leerDisco() {
    await mkdir(this.directorio, { recursive: true });
    return statfs(this.directorio);
  }

  private async leerDocker(): Promise<Pick<ReporteServidor, "docker" | "errorDocker">> {
    try {
      const [{ Version }, contenedores] = await Promise.all([
        this.docker.version(),
        this.docker.listContainers({ filters: { label: [`${PROYECTO_COMPOSE}=${this.proyectoCompose}`] } }),
      ]);
      return { docker: { version: Version, contenedores: contenedores.length }, errorDocker: null };
    } catch (error) {
      return { docker: null, errorDocker: error instanceof Error ? error.message : String(error) };
    }
  }
}
