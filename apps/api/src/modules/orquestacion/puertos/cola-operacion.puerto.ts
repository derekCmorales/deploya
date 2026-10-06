import type { AccionContenedor } from "../dominio/accion-contenedor";

/** Productor de la cola `operacion` (BullMQ en compose, memoria en pruebas). La API nunca llama a Docker. */
export abstract class ColaOperacionPuerto {
  abstract encolar(accion: AccionContenedor): Promise<void>;
}
