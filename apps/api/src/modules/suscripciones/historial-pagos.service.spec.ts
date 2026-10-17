import { ComprobanteTextoFalso } from "./adaptadores/comprobante-texto.falso";
import { planesDePrueba } from "./adaptadores/planes.fixture";
import { RepositorioPagosMemoria } from "./adaptadores/repositorio-pagos.memoria";
import { PagoNoEncontrado } from "./dominio/errores";
import type { NuevoPago } from "./dominio/pago";
import { HistorialPagosService } from "./historial-pagos.service";

function pago(cambios: Partial<NuevoPago> = {}): NuevoPago {
  return {
    usuarioId: "u-derek",
    suscripcionId: "s1",
    planId: "plan-starter",
    concepto: "contratacion",
    vigenciaDias: 30,
    monto: 5,
    estado: "aprobado",
    motivoRechazo: null,
    tarjetaUltimos4: "4242",
    creado: new Date("2026-09-03T16:10:00.000Z"),
    ...cambios,
  };
}

async function armar() {
  const pagos = new RepositorioPagosMemoria(planesDePrueba(), { "u-derek": "Derek Calderón", "u-ana": "Ana Gómez" });
  const rechazado = await pagos.registrar(
    pago({ estado: "rechazado", motivoRechazo: "Fondos insuficientes (simulado).", tarjetaUltimos4: "0002", creado: new Date("2026-09-03T16:05:00.000Z") }),
  );
  const aprobado = await pagos.registrar(pago());
  const ajeno = await pagos.registrar(pago({ usuarioId: "u-ana", creado: new Date("2026-09-10T10:00:00.000Z") }));
  const pdf = new ComprobanteTextoFalso();
  return { servicio: new HistorialPagosService(pagos, pdf), pdf, aprobado, rechazado, ajeno };
}

describe("M2-06 · HistorialPagosService", () => {
  it("Ver historial", async () => {
    const { servicio } = await armar();

    const filas = await servicio.deUsuario("u-derek");

    expect(filas.map((f) => f.estado)).toEqual(["aprobado", "rechazado"]);
    expect(filas[0]).toEqual({
      id: expect.any(String),
      fecha: new Date("2026-09-03T16:10:00.000Z"),
      concepto: "Plan Starter · 30 días",
      plan: "Starter",
      monto: 5,
      moneda: "USD",
      estado: "aprobado",
      comprobante: "DPY-2026-000001",
      vigencia: { desde: new Date("2026-09-03T16:10:00.000Z"), hasta: new Date("2026-10-03T16:10:00.000Z") },
      tarjeta: "•••• 4242",
      titular: "Derek Calderón",
    });
    expect(filas[1]).toMatchObject({ concepto: "Plan Starter · 30 días", comprobante: null, vigencia: null, tarjeta: "•••• 0002" });
  });

  it("Sin pagos", async () => {
    const { servicio } = await armar();

    await expect(servicio.deUsuario("u-nuevo-sandbox")).resolves.toEqual([]);
  });

  it("Descargar comprobante", async () => {
    const { servicio, aprobado } = await armar();

    const archivo = await servicio.pdfDe("u-derek", aprobado.id);
    const texto = archivo.contenido.toString("utf8");

    expect(archivo.nombre).toBe("DPY-2026-000001.pdf");
    expect(texto).toContain("Número: DPY-2026-000001");
    expect(texto).toContain("Fecha: 03 sep 2026, 16:10");
    expect(texto).toContain("Concepto: Plan Starter · 30 días");
    expect(texto).toContain("Vigencia: 03 sep → 03 oct 2026");
    expect(texto).toContain("Método: Prueba •••• 4242");
    expect(texto).toContain("Titular: Derek Calderón");
    expect(texto).toContain("Total: USD 5.00");
    expect(texto).toContain("sin valor fiscal");
  });

  it("Comprobante de otro cliente", async () => {
    const { servicio, pdf, ajeno } = await armar();

    await expect(servicio.pdfDe("u-derek", ajeno.id)).rejects.toBeInstanceOf(PagoNoEncontrado);
    expect(pdf.generados).toEqual([]);
  });

  it("un pago rechazado no tiene comprobante → 404", async () => {
    const { servicio, pdf, rechazado } = await armar();

    await expect(servicio.pdfDe("u-derek", rechazado.id)).rejects.toBeInstanceOf(PagoNoEncontrado);
    expect(pdf.generados).toEqual([]);
  });

  it("un pago que no existe → 404", async () => {
    const { servicio } = await armar();

    await expect(servicio.comprobante("u-derek", "pago-x")).rejects.toBeInstanceOf(PagoNoEncontrado);
  });
});
