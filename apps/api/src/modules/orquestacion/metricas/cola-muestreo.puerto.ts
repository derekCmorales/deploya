/**
 * La tarea de muestreo vista desde M5: programa la corrida cada 60 s y entrega
 * cada tick al manejador. BullMQ en compose, memoria en pruebas.
 */
export abstract class ColaMuestreoPuerto {
  abstract iniciar(manejador: () => Promise<unknown>): Promise<void>;
  abstract cerrar(): Promise<void>;
}
