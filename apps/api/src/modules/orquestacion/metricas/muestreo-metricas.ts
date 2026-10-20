import { Injectable, Logger } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import { RepositorioDespliegues, type DespliegueMuestreable } from "../../construccion/puertos/repositorio-despliegues.puerto";
import { RETENCION_MUESTRAS_MS } from "./metricas.constantes";
import { MetricasContenedorPuerto, type MuestraContenedor } from "../puertos/metricas-contenedor.puerto";
import { MuestrasMetricas } from "../puertos/muestras-metricas.puerto";

/**
 * Un tick: muestra el contenedor del despliegue activo Saludable de cada proyecto
 * y purga lo de más de 24 h. Un contenedor ilegible no frena al resto.
 */
@Injectable()
export class MuestreoMetricas {
  private readonly registro = new Logger(MuestreoMetricas.name);

  constructor(
    private readonly metricas: MetricasContenedorPuerto,
    private readonly muestras: MuestrasMetricas,
    private readonly despliegues: RepositorioDespliegues,
    private readonly reloj: Reloj,
  ) {}

  async correr(): Promise<void> {
    await this.muestrearActivos();
    await this.purgar();
  }

  private async muestrearActivos(): Promise<void> {
    const activos = await this.despliegues.activosSaludables();
    for (const activo of activos) await this.guardarMuestra(activo);
  }

  private async guardarMuestra(activo: DespliegueMuestreable): Promise<void> {
    const muestra = await this.leerMuestra(activo.contenedorId);
    if (!muestra) return;
    await this.muestras.guardar({
      despliegueId: activo.despliegueId,
      tomada: this.reloj.ahora(),
      cpu: muestra.cpu,
      memoriaMb: muestra.memoriaMb,
    });
  }

  private async leerMuestra(contenedorId: string): Promise<MuestraContenedor | null> {
    try {
      return await this.metricas.muestra(contenedorId);
    } catch (error) {
      this.registro.warn(`No se pudo muestrear ${contenedorId}: ${error instanceof Error ? error.message : "error"}`);
      return null;
    }
  }

  private async purgar(): Promise<void> {
    const limite = new Date(this.reloj.ahora().getTime() - RETENCION_MUESTRAS_MS);
    await this.muestras.purgarAntesDe(limite);
  }
}
