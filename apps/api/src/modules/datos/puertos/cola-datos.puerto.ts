import type { ComandoDatos } from "../dominio/comando-datos";

/** Productor de la cola `datos` (BullMQ en compose, memoria en pruebas). La API nunca llama a Docker. */
export abstract class ColaDatosPuerto {
  abstract encolar(comando: ComandoDatos): Promise<void>;
}
