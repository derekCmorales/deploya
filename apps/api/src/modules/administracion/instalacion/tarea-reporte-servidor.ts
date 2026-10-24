import { Injectable, Logger, type OnApplicationBootstrap, type OnModuleDestroy } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import { LecturaServidorPuerto, ReporteServidorPuerto } from "./puertos/reporte-servidor.puerto";

/** «Se comprueba cada 10 minutos» (pantalla 32). */
export const INTERVALO_REPORTE_MS = 10 * 60 * 1000;

/**
 * En el trabajador, el único proceso con docker.sock (ADR 0002): mide el servidor al arrancar y
 * cada 10 min y deja el reporte para Admin · Instalación. Un fallo se registra y no tumba al trabajador.
 */
@Injectable()
export class TareaReporteServidor implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly registro = new Logger(TareaReporteServidor.name);
  private temporizador: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly lectura: LecturaServidorPuerto,
    private readonly reportes: ReporteServidorPuerto,
    private readonly reloj: Reloj,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.reportar();
    this.temporizador = setInterval(() => void this.reportar(), INTERVALO_REPORTE_MS);
    this.temporizador.unref();
  }

  onModuleDestroy(): void {
    if (this.temporizador) clearInterval(this.temporizador);
  }

  async reportar(): Promise<void> {
    try {
      await this.reportes.publicar({ ...(await this.lectura.medir()), tomado: this.reloj.ahora() });
    } catch (error) {
      this.registro.warn(`No se pudo reportar el estado del servidor: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
