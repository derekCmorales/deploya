/** Pausa como dependencia: la tarjeta que «tarda 5 s» se prueba sin esperar de verdad. */
export abstract class Espera {
  abstract esperar(milisegundos: number): Promise<void>;
}
