import type { TrabajoDespliegue } from "../dominio/despliegue";

/** Productor de la cola de despliegues (BullMQ en compose, memoria en pruebas). */
export abstract class ColaConstruccionPuerto {
  abstract encolar(trabajo: TrabajoDespliegue): Promise<void>;
  /** Saca un trabajo que aún espera (cancelar un Encolado). `false` si ya no está o el trabajador ya lo tomó. */
  abstract quitar(despliegueId: string): Promise<boolean>;
}
