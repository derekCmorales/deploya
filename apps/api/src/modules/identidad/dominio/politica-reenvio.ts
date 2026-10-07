/** M1-04: entre un correo de verificación y el siguiente pasan al menos 60 segundos. */
export const ESPERA_REENVIO_MS = 60_000;

const MS_POR_SEGUNDO = 1000;

/**
 * Regla pura de la cuenta atrás (design.md, decisión 1): la decide el servidor con el `Reloj`
 * y la web solo muestra el número que recibe.
 */
export class PoliticaReenvio {
  /** Segundos enteros que faltan (redondeados hacia arriba); 0 si ya se puede reenviar. */
  segundosRestantes(creadoUltimo: Date, ahora: Date): number {
    const faltan = ESPERA_REENVIO_MS - (ahora.getTime() - creadoUltimo.getTime());
    return faltan > 0 ? Math.ceil(faltan / MS_POR_SEGUNDO) : 0;
  }
}
