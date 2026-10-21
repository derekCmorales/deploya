import { Queue, Worker } from "bullmq";
import { conexionRedis } from "../../../adapters/reales/cola-bullmq";
import { COLA_MUESTREO, PROGRAMADOR_MUESTREO, programacionMuestreo } from "./metricas.constantes";
import { ColaMuestreoPuerto } from "./cola-muestreo.puerto";

/**
 * Adapter BullMQ: `upsertJobScheduler` no duplica el tick si el trabajador reinicia.
 * Concurrencia 1 para no muestrear dos veces el mismo minuto.
 */
export class ColaMuestreoBullMq extends ColaMuestreoPuerto {
  private readonly cola: Queue;
  private consumidor: Worker | null = null;

  constructor(private readonly redisUrl: string) {
    super();
    this.cola = new Queue(COLA_MUESTREO, { connection: conexionRedis(redisUrl) });
  }

  async iniciar(manejador: () => Promise<unknown>): Promise<void> {
    await this.cola.upsertJobScheduler(PROGRAMADOR_MUESTREO, programacionMuestreo(), { name: PROGRAMADOR_MUESTREO });
    this.consumidor = new Worker(COLA_MUESTREO, () => manejador(), { connection: conexionRedis(this.redisUrl), concurrency: 1 });
  }

  async cerrar(): Promise<void> {
    await Promise.all([this.consumidor?.close(), this.cola.close()]);
  }
}
