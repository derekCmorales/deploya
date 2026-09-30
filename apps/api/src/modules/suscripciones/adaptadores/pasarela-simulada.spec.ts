import type { Tarjeta } from "../dominio/tarjeta";
import { EsperaInstantanea } from "./espera-temporizador";
import { DEMORA_TARJETA_LENTA_MS, PasarelaSimulada, TARJETA_APRUEBA, TARJETA_RECHAZA, TARJETA_TARDA } from "./pasarela-simulada";

function cargo(numero: string) {
  const tarjeta: Tarjeta = { titular: "Derek", numero, vencimiento: "12/28", cvc: "123" };
  return { monto: 5, moneda: "USD", concepto: "contratacion", tarjeta };
}

describe("PasarelaSimulada", () => {
  it("4242 4242 4242 4242 aprueba sin esperar", async () => {
    const espera = new EsperaInstantanea();
    await expect(new PasarelaSimulada(espera).cobrar(cargo(TARJETA_APRUEBA))).resolves.toEqual({ aprobado: true, tarjetaUltimos4: "4242" });
    expect(espera.pedidas).toEqual([]);
  });

  it("4000 0000 0000 0002 rechaza por fondos insuficientes", async () => {
    await expect(new PasarelaSimulada(new EsperaInstantanea()).cobrar(cargo(TARJETA_RECHAZA))).resolves.toEqual({
      aprobado: false,
      tarjetaUltimos4: "0002",
      codigo: "card_declined",
      motivo: "Fondos insuficientes (simulado).",
    });
  });

  it("Tarjeta que tarda", async () => {
    const espera = new EsperaInstantanea();
    await expect(new PasarelaSimulada(espera).cobrar(cargo(TARJETA_TARDA))).resolves.toMatchObject({ aprobado: true });
    expect(espera.pedidas).toEqual([DEMORA_TARJETA_LENTA_MS]);
  });

  it("Tarjeta que no es de prueba", async () => {
    await expect(new PasarelaSimulada(new EsperaInstantanea()).cobrar(cargo("5555555555554444"))).resolves.toMatchObject({
      aprobado: false,
      codigo: "card_not_supported",
      tarjetaUltimos4: "4444",
    });
  });
});
