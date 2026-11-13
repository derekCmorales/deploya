import type Docker from "dockerode";
import { muestraDesdeStats, type StatsMotor } from "../../modules/orquestacion/metricas/dominio/muestra-desde-stats";
import { MuestraIlegible } from "../../modules/orquestacion/metricas/dominio/errores";
import {
  MetricasContenedorPuerto,
  type MuestraContenedor,
} from "../../modules/orquestacion/puertos/metricas-contenedor.puerto";

const TIEMPO_MAXIMO_STATS_MS = 10_000;
const ID_CONTENEDOR = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/;

/**
 * Adapter: `GET /containers/{id}/stats?stream=false` por el socket, como el resto de los
 * adaptadores de Docker. La imagen del trabajador no trae el binario `docker`.
 */
export class MetricasDockerStats extends MetricasContenedorPuerto {
  constructor(
    private readonly docker: Docker,
    private readonly tiempoMaximoMs: number = TIEMPO_MAXIMO_STATS_MS,
  ) {
    super();
  }

  async muestra(contenedorId: string): Promise<MuestraContenedor> {
    if (!ID_CONTENEDOR.test(contenedorId)) throw new MuestraIlegible("id de contenedor inválido");
    return muestraDesdeStats(await this.leer(contenedorId));
  }

  private async leer(contenedorId: string): Promise<StatsMotor> {
    let timer: NodeJS.Timeout | undefined;
    const vencido = new Promise<never>((_, rechazar) => {
      timer = setTimeout(() => rechazar(new MuestraIlegible("stats no respondió a tiempo")), this.tiempoMaximoMs);
    });
    try {
      const stats = this.docker.getContainer(contenedorId).stats({ stream: false });
      return (await Promise.race([stats, vencido])) as StatsMotor;
    } catch (error) {
      if (error instanceof MuestraIlegible) throw error;
      throw new MuestraIlegible(error instanceof Error ? error.message : "stats falló");
    } finally {
      clearTimeout(timer);
    }
  }
}
