import { Injectable } from "@nestjs/common";

/** Pausa como dependencia: lo que «tarda 5 s» o «espera 2 min» se prueba sin esperar de verdad. */
export abstract class Espera {
  abstract esperar(milisegundos: number): Promise<void>;
}

@Injectable()
export class EsperaTemporizador extends Espera {
  esperar(milisegundos: number): Promise<void> {
    return new Promise((resolver) => setTimeout(resolver, milisegundos));
  }
}

/** Doble para pruebas: no espera y anota cuánto se pidió. */
export class EsperaInstantanea extends Espera {
  readonly pedidas: number[] = [];

  async esperar(milisegundos: number): Promise<void> {
    this.pedidas.push(milisegundos);
  }
}
