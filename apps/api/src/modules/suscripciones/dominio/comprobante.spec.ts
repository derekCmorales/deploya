import { Comprobante, fechaHora, textoMonto, textoVigencia, vigenciaDe, type PagoHistorial } from "./comprobante";

const PAGO: PagoHistorial = {
  id: "pg1",
  usuarioId: "u-derek",
  suscripcionId: "s1",
  planId: "plan-pro",
  planNombre: "Pro",
  titular: "Derek Calderón",
  correo: "derek@tiendademo.com",
  concepto: "renovacion",
  vigenciaDias: 365,
  monto: 150,
  moneda: "USD",
  estado: "aprobado",
  motivoRechazo: null,
  tarjetaUltimos4: "4242",
  numeroComprobante: "DPY-2026-000142",
  creado: new Date("2026-01-05T08:03:00.000Z"),
};

describe("M2-06 · Comprobante", () => {
  it("formatos de fecha, vigencia y monto en UTC", () => {
    expect(fechaHora(PAGO.creado)).toBe("05 ene 2026, 08:03");
    expect(textoVigencia(vigenciaDe(PAGO)!)).toBe("05 ene → 05 ene 2027");
    expect(textoMonto(150, "USD")).toBe("USD 150.00");
  });

  it("un pago aprobado arma el comprobante como recibo, sin leyendas de demo", () => {
    const comprobante = Comprobante.desde(PAGO)!;

    expect(comprobante.nombreArchivo).toBe("DPY-2026-000142.pdf");
    expect(comprobante.partida()).toEqual({
      descripcion: "Plan Pro",
      detalle: "Suscripción de 365 días",
      vigencia: "05 ene → 05 ene 2027",
      monto: "USD 150.00",
    });
    expect(comprobante.lineas()).toEqual([
      "deploya · Comprobante de pago",
      "Número: DPY-2026-000142",
      "Estado: Aprobado",
      "Total pagado: USD 150.00",
      "Fecha de pago: 05 ene 2026, 08:03",
      "Facturado a: Derek Calderón · derek@tiendademo.com",
      "Método de pago: Tarjeta •••• 4242",
      "Concepto: Plan Pro · Suscripción de 365 días",
      "Vigencia: 05 ene → 05 ene 2027",
      "Subtotal: USD 150.00",
      "Total: USD 150.00",
      "Gracias por confiar en deploya.",
      "¿Dudas sobre este cobro? Escríbenos a soporte@deploya.app",
    ]);
  });

  it("un pago rechazado no tiene comprobante ni vigencia", () => {
    const rechazado = { ...PAGO, estado: "rechazado" as const, numeroComprobante: null };

    expect(Comprobante.desde(rechazado)).toBeNull();
    expect(vigenciaDe(rechazado)).toBeNull();
  });
});
