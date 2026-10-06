import { CuotaConstruccionesAgotada, SuscripcionNoPermite } from "./errores";
import { inicioDelMes, verificarDespliegue } from "./politica-despliegue";

describe("PoliticaDespliegue", () => {
  it.each(["vencida", "suspendida", "cancelada"] as const)("la suscripción %s bloquea aunque queden construcciones", (estado) => {
    expect(() => verificarDespliegue({ estado, construccionesUsadas: 0, construccionesMes: 30 })).toThrow(SuscripcionNoPermite);
  });

  it.each(["activa", "por-vencer"] as const)("la suscripción %s con cuota disponible permite", (estado) => {
    expect(() => verificarDespliegue({ estado, construccionesUsadas: 29, construccionesMes: 30 })).not.toThrow();
  });

  it("primero el estado y luego la cuota: vencida y sin cuota responde suscripcion-no-permite", () => {
    expect(() => verificarDespliegue({ estado: "vencida", construccionesUsadas: 30, construccionesMes: 30 })).toThrow(
      SuscripcionNoPermite,
    );
  });

  it("la construcción 31 de Sandbox se rechaza con cuota-construcciones-agotada", () => {
    const intento = () => verificarDespliegue({ estado: "activa", construccionesUsadas: 30, construccionesMes: 30 });

    expect(intento).toThrow(CuotaConstruccionesAgotada);
    expect(intento).toThrow("Usaste las 30 construcciones de tu plan este mes");
  });

  it("inicioDelMes es el día 1 a las 00:00 UTC, también cerca del cambio de mes", () => {
    expect(inicioDelMes(new Date("2026-10-06T15:30:00Z")).toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(inicioDelMes(new Date("2026-10-01T00:00:00Z")).toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(inicioDelMes(new Date("2026-09-30T23:59:59Z")).toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });
});
