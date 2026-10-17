import { Comprobante, fechaHora, textoMonto, textoVigencia, vigenciaDe, type PagoHistorial } from "./comprobante";

const PAGO: PagoHistorial = {
  id: "pg1",
  usuarioId: "u-derek",
  suscripcionId: "s1",
  planId: "plan-pro",
  planNombre: "Pro",
  titular: "Derek Calderón",
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

  it("un pago aprobado arma el comprobante con su nombre de archivo", () => {
    const comprobante = Comprobante.desde(PAGO)!;

    expect(comprobante.nombreArchivo).toBe("DPY-2026-000142.pdf");
    expect(comprobante.lineas()).toEqual([
      "deploya · Comprobante de pago",
      "Número: DPY-2026-000142",
      "Fecha: 05 ene 2026, 08:03",
      "Concepto: Plan Pro · 365 días",
      "Vigencia: 05 ene → 05 ene 2027",
      "Método: Prueba •••• 4242",
      "Titular: Derek Calderón",
      "Subtotal: USD 150.00",
      "Total: USD 150.00",
      "Pago simulado · sin cobro real · sin valor fiscal.",
    ]);
  });

  it("un pago rechazado no tiene comprobante ni vigencia", () => {
    const rechazado = { ...PAGO, estado: "rechazado" as const, numeroComprobante: null };

    expect(Comprobante.desde(rechazado)).toBeNull();
    expect(vigenciaDe(rechazado)).toBeNull();
  });
});
