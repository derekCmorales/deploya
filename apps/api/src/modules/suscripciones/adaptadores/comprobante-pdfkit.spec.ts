import { Comprobante } from "../dominio/comprobante";
import { ComprobantePdfKit } from "./comprobante-pdfkit";

const FIRMA_PDF = "%PDF-";

describe("M2-06 · ComprobantePdfKit", () => {
  it("genera un PDF en memoria (sin disco ni red)", async () => {
    const comprobante = Comprobante.desde({
      id: "pg1",
      usuarioId: "u-derek",
      suscripcionId: "s1",
      planId: "plan-starter",
      planNombre: "Starter",
      titular: "Derek Calderón",
      correo: "derek@tiendademo.com",
      concepto: "contratacion",
      vigenciaDias: 30,
      monto: 5,
      moneda: "USD",
      estado: "aprobado",
      motivoRechazo: null,
      tarjetaUltimos4: "4242",
      numeroComprobante: "DPY-2026-000142",
      creado: new Date("2026-09-03T16:10:00.000Z"),
    })!;

    const pdf = await new ComprobantePdfKit().generar(comprobante);

    expect(pdf.subarray(0, FIRMA_PDF.length).toString("latin1")).toBe(FIRMA_PDF);
    expect(pdf.length).toBeGreaterThan(1000);
    expect(pdf.toString("latin1")).toMatch(/\/BaseFont \/[A-Z]{6}\+Geist-Bold/);
  });
});
