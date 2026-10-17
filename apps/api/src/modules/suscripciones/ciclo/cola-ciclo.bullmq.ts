import { Queue, Worker } from "bullmq";
import { conexionRedis } from "../../../adapters/reales/cola-bullmq";
import { COLA_CICLO, PATRON_CICLO, PROGRAMADOR_CICLO, ZONA_CICLO } from "./ciclo.constantes";
import { ColaCicloPuerto } from "./cola-ciclo.puerto";

/**
 * Adapter BullMQ de la tarea diaria: un programador repetible (`upsertJobScheduler` no duplica
 * la tarea si el trabajador reinicia) y un consumidor de concurrencia 1.
 */
export class ColaCicloBullMq extends ColaCicloPuerto {
  private readonly cola: Queue;
  private consumidor: Worker | null = null;

  constructor(private readonly redisUrl: string) {
    super();
    this.cola = new Queue(COLA_CICLO, { connection: conexionRedis(redisUrl) });
  }

  async iniciar(manejador: () => Promise<unknown>): Promise<void> {
    await this.cola.upsertJobScheduler(PROGRAMADOR_CICLO, { pattern: PATRON_CICLO, tz: ZONA_CICLO }, { name: PROGRAMADOR_CICLO });
    this.consumidor = new Worker(COLA_CICLO, () => manejador(), { connection: conexionRedis(this.redisUrl), concurrency: 1 });
  }

  async cerrar(): Promise<void> {
    await Promise.all([this.consumidor?.close(), this.cola.close()]);
  }
}
