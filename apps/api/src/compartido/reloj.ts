import { Injectable } from "@nestjs/common";

/** Tiempo como dependencia: nada de `Date.now()` en dominio ni servicios. */
export abstract class Reloj {
  abstract ahora(): Date;
}

@Injectable()
export class RelojSistema extends Reloj {
  ahora(): Date {
    return new Date();
  }
}

/** Reloj controlado para pruebas: avanza solo cuando se le pide. */
export class RelojFijo extends Reloj {
  constructor(private actual: Date = new Date("2026-09-30T12:00:00.000Z")) {
    super();
  }

  ahora(): Date {
    return new Date(this.actual);
  }

  avanzar(milisegundos: number): void {
    this.actual = new Date(this.actual.getTime() + milisegundos);
  }
}
