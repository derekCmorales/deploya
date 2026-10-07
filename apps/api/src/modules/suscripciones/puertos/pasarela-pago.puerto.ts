import type { Tarjeta } from "../dominio/tarjeta";

export interface Cargo {
  monto: number;
  moneda: string;
  concepto: string;
  tarjeta: Tarjeta;
}

export type ResultadoCobro =
  | { aprobado: true; tarjetaUltimos4: string }
  | { aprobado: false; tarjetaUltimos4: string; codigo: string; motivo: string };

/** Cobro del plan (sin prefijo `I`). En el núcleo v4.1 solo existe la pasarela simulada. */
export abstract class PasarelaPago {
  abstract cobrar(cargo: Cargo): Promise<ResultadoCobro>;
}
