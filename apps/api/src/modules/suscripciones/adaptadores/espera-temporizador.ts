import { Injectable } from "@nestjs/common";
import { Espera } from "../puertos/espera.puerto";

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
