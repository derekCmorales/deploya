import type { Cuota, Suscripcion } from "../dominio/suscripcion";

/** Strategy (SP-06): de dónde salen los límites que leen M3, M4 y M5 por `cuotaDe`. */
export abstract class PoliticaCuotas {
  abstract cuotaDe(suscripcion: Suscripcion): Promise<Cuota>;
}
