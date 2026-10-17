/**
 * La tarea diaria del ciclo vista desde M2: programa la corrida repetible y entrega cada
 * corrida al manejador. BullMQ en compose, memoria en pruebas.
 */
export abstract class ColaCicloPuerto {
  abstract iniciar(manejador: () => Promise<unknown>): Promise<void>;
  abstract cerrar(): Promise<void>;
}
