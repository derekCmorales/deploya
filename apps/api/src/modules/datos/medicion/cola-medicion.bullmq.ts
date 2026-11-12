import { Queue, Worker } from "bullmq";
import { conexionRedis } from "../../../adapters/reales/cola-bullmq";
import { CADA_MS_MEDICION_DISCO, COLA_MEDICION_DISCO, ColaMedicionDiscoPuerto, PROGRAMADOR_MEDICION_DISCO } from "./cola-medicion.puerto";

/** Adapter BullMQ: `upsertJobScheduler` no duplica el tick si el trabajador reinicia; concurrencia 1. */
export class ColaMedicionDiscoBullMq extends ColaMedicionDiscoPuerto {
  private readonly cola: Queue;
  private consumidor: Worker | null = null;

  constructor(private readonly redisUrl: string) {
    super();
    this.cola = new Queue(COLA_MEDICION_DISCO, { connection: conexionRedis(redisUrl) });
  }

  async iniciar(manejador: () => Promise<unknown>): Promise<void> {
    await this.cola.upsertJobScheduler(PROGRAMADOR_MEDICION_DISCO, { every: CADA_MS_MEDICION_DISCO }, { name: PROGRAMADOR_MEDICION_DISCO });
    this.consumidor = new Worker(COLA_MEDICION_DISCO, () => manejador(), { connection: conexionRedis(this.redisUrl), concurrency: 1 });
  }

  async cerrar(): Promise<void> {
    await Promise.all([this.consumidor?.close(), this.cola.close()]);
  }
}
