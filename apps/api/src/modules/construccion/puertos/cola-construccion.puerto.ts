import type { TrabajoDespliegue } from "../dominio/despliegue";

/** Productor de la cola de despliegues (BullMQ en compose, memoria en pruebas). */
export abstract class ColaConstruccionPuerto {
  abstract encolar(trabajo: TrabajoDespliegue): Promise<void>;
}
