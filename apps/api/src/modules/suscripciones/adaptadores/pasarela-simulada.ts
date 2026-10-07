import { Injectable } from "@nestjs/common";
import { ultimos4 } from "../dominio/tarjeta";
import { Espera } from "../puertos/espera.puerto";
import { PasarelaPago, type Cargo, type ResultadoCobro } from "../puertos/pasarela-pago.puerto";

/** Tarjetas de prueba de la pantalla 07 (spec «Contratación con pago simulado»). */
export const TARJETA_APRUEBA = "4242424242424242";
export const TARJETA_RECHAZA = "4000000000000002";
export const TARJETA_TARDA = "4000000000003220";
export const DEMORA_TARJETA_LENTA_MS = 5000;

const RECHAZO_FONDOS = { codigo: "card_declined", motivo: "Fondos insuficientes (simulado)." };
const RECHAZO_DESCONOCIDA = {
  codigo: "card_not_supported",
  motivo: "La pasarela simulada solo acepta las tarjetas de prueba.",
};

/** Adapter de `PasarelaPago`: no hay dinero real. La espera se inyecta para probar la tarjeta lenta. */
@Injectable()
export class PasarelaSimulada extends PasarelaPago {
  constructor(private readonly espera: Espera) {
    super();
  }

  async cobrar({ tarjeta }: Cargo): Promise<ResultadoCobro> {
    const tarjetaUltimos4 = ultimos4(tarjeta.numero);
    if (tarjeta.numero === TARJETA_TARDA) await this.espera.esperar(DEMORA_TARJETA_LENTA_MS);
    if (tarjeta.numero === TARJETA_APRUEBA || tarjeta.numero === TARJETA_TARDA) return { aprobado: true, tarjetaUltimos4 };
    const rechazo = tarjeta.numero === TARJETA_RECHAZA ? RECHAZO_FONDOS : RECHAZO_DESCONOCIDA;
    return { aprobado: false, tarjetaUltimos4, ...rechazo };
  }
}
