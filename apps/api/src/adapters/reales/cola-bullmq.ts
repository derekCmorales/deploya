import { Queue, Worker, type ConnectionOptions } from "bullmq";
import type { TrabajoDespliegue } from "../../modules/construccion/dominio/despliegue";
import { COLA_DESPLIEGUES } from "../../modules/construccion/dominio/motor.constantes";
import { ColaConstruccionPuerto } from "../../modules/construccion/puertos/cola-construccion.puerto";

const TRABAJOS_CONSERVADOS = 1000;

export function conexionRedis(redisUrl: string): ConnectionOptions {
  const url = new URL(redisUrl);
  return { host: url.hostname, port: Number(url.port || 6379), maxRetriesPerRequest: null };
}

/**
 * Productor BullMQ. `jobId = despliegueId` hace idempotente el encolado; sin
 * reintentos automáticos: reintentar es una acción del cliente (ADR 0002).
 */
export class ColaBullMq extends ColaConstruccionPuerto {
  private readonly cola: Queue<TrabajoDespliegue>;

  constructor(redisUrl: string) {
    super();
    this.cola = new Queue<TrabajoDespliegue>(COLA_DESPLIEGUES, { connection: conexionRedis(redisUrl) });
  }

  async encolar(trabajo: TrabajoDespliegue): Promise<void> {
    await this.cola.add(trabajo.plan, trabajo, {
      jobId: trabajo.despliegueId,
      attempts: 1,
      removeOnComplete: TRABAJOS_CONSERVADOS,
      removeOnFail: TRABAJOS_CONSERVADOS,
    });
  }

  async cerrar(): Promise<void> {
    await this.cola.close();
  }
}

/** Consumidor BullMQ: entrega cada trabajo al manejador (el pipeline) en el trabajador. */
export function consumirDespliegues(
  redisUrl: string,
  concurrencia: number,
  manejador: (trabajo: TrabajoDespliegue) => Promise<void>,
): Worker<TrabajoDespliegue> {
  return new Worker<TrabajoDespliegue>(COLA_DESPLIEGUES, (trabajo) => manejador(trabajo.data), {
    connection: conexionRedis(redisUrl),
    concurrency: concurrencia,
  });
}
