/** La medición periódica del disco vista desde el trabajador: programa el tick y se lo entrega al manejador. */
export abstract class ColaMedicionDiscoPuerto {
  abstract iniciar(manejador: () => Promise<unknown>): Promise<void>;
  abstract cerrar(): Promise<void>;
}

/** Cada 5 min: el disco crece despacio y `du` sobre un volumen grande no es gratis. */
export const CADA_MS_MEDICION_DISCO = 5 * 60 * 1000;
export const COLA_MEDICION_DISCO = "medicion-disco-datos";
export const PROGRAMADOR_MEDICION_DISCO = "medicion-disco-cada-5-min";
