/** La tarea diaria de limpieza: programa la corrida repetible y la entrega al manejador. */
export abstract class ColaLimpiezaPuerto {
  abstract iniciar(manejador: () => Promise<unknown>): Promise<void>;
  abstract cerrar(): Promise<void>;
}
