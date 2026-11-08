import { Queue, Worker } from "bullmq";
import { conexionRedis } from "../../../adapters/reales/cola-bullmq";
import { ColaLimpiezaPuerto } from "./cola-limpieza.puerto";
import { COLA_LIMPIEZA, PATRON_LIMPIEZA, PROGRAMADOR_LIMPIEZA, ZONA_LIMPIEZA } from "./limpieza.constantes";

/**
 * Adapter BullMQ, igual que `ColaCicloBullMq`: `upsertJobScheduler` no duplica la tarea si el
 * trabajador reinicia y el consumidor corre de a una.
 */
export class ColaLimpiezaBullMq extends ColaLimpiezaPuerto {
  private readonly cola: Queue;
  private consumidor: Worker | null = null;

  constructor(private readonly redisUrl: string) {
    super();
    this.cola = new Queue(COLA_LIMPIEZA, { connection: conexionRedis(redisUrl) });
  }

  async iniciar(manejador: () => Promise<unknown>): Promise<void> {
    await this.cola.upsertJobScheduler(PROGRAMADOR_LIMPIEZA, { pattern: PATRON_LIMPIEZA, tz: ZONA_LIMPIEZA }, { name: PROGRAMADOR_LIMPIEZA });
    this.consumidor = new Worker(COLA_LIMPIEZA, () => manejador(), { connection: conexionRedis(this.redisUrl), concurrency: 1 });
  }

  async cerrar(): Promise<void> {
    await Promise.all([this.consumidor?.close(), this.cola.close()]);
  }
}
