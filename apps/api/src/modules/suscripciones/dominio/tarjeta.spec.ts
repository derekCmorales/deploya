import { DatosPagoInvalidos } from "./errores";
import { numeroComprobante } from "./pago";
import { ultimos4, validarSolicitudContratacion, validarSolicitudCotizacion, validarSolicitudDescenso } from "./tarjeta";

const TARJETA = { titular: "Derek Calderón", numero: "4242 4242 4242 4242", vencimiento: "12 / 28", cvc: "123" };

describe("validación del cuerpo de pago", () => {
  it("normaliza plan, vigencia y tarjeta", () => {
    expect(validarSolicitudContratacion({ plan: " Starter ", vigenciaDias: "365", tarjeta: TARJETA })).toEqual({
      plan: "starter",
      vigenciaDias: 365,
      tarjeta: { titular: "Derek Calderón", numero: "4242424242424242", vencimiento: "12/28", cvc: "123" },
    });
  });

  it("sin vigencia usa 30 días", () => {
    expect(validarSolicitudCotizacion({ plan: "pro" })).toEqual({ plan: "pro", vigenciaDias: 30 });
  });

  it.each([
    [null, "Faltan los datos del pago."],
    [{ plan: "", tarjeta: TARJETA }, "Falta el plan."],
    [{ plan: "pro", vigenciaDias: 90, tarjeta: TARJETA }, "La vigencia debe ser de 30 o 365 días."],
    [{ plan: "pro" }, "Faltan los datos de la tarjeta."],
    [{ plan: "pro", tarjeta: { ...TARJETA, titular: " " } }, "Escribe el titular de la tarjeta."],
    [{ plan: "pro", tarjeta: { ...TARJETA, numero: "4242" } }, "El número de tarjeta debe tener 16 dígitos."],
    [{ plan: "pro", tarjeta: { ...TARJETA, vencimiento: "13/28" } }, "El vencimiento debe ser MM / AA."],
    [{ plan: "pro", tarjeta: { ...TARJETA, vencimiento: "1228" } }, "El vencimiento debe ser MM / AA."],
    [{ plan: "pro", tarjeta: { ...TARJETA, cvc: "12" } }, "El CVC debe tener 3 o 4 dígitos."],
  ])("rechaza %p con «%s»", (cuerpo, mensaje) => {
    expect(() => validarSolicitudContratacion(cuerpo)).toThrow(new DatosPagoInvalidos(mensaje));
  });

  it("el descenso solo necesita el plan", () => {
    expect(validarSolicitudDescenso({ plan: "Sandbox" })).toEqual({ plan: "sandbox" });
    expect(() => validarSolicitudDescenso([])).toThrow(DatosPagoInvalidos);
  });

  it("del número solo quedan los últimos 4 y el comprobante es DPY-AAAA-NNNNNN", () => {
    expect(ultimos4("4000000000000002")).toBe("0002");
    expect(numeroComprobante(2026, 184)).toBe("DPY-2026-000184");
  });
});
