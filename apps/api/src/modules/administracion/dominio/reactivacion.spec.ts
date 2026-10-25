import { CuentaNoSuspendida, DetalleInvalido } from "./errores";
import { DETALLE_MAXIMO } from "./suspension";
import { exigirReactivable, reanudaContenedores, validarSolicitudReactivacion } from "./reactivacion";

describe("SP-05 · reglas de reactivación", () => {
  it("el detalle es opcional, se recorta y admite hasta 500 caracteres", () => {
    expect(validarSolicitudReactivacion(undefined)).toEqual({ detalle: null });
    expect(validarSolicitudReactivacion({ detalle: "  aclarado  " })).toEqual({ detalle: "aclarado" });
    expect(() => validarSolicitudReactivacion({ detalle: "x".repeat(DETALLE_MAXIMO + 1) })).toThrow(DetalleInvalido);
  });

  it("solo se reactiva una cuenta suspendida", () => {
    expect(() => exigirReactivable({ id: "c", rol: "cliente", estadoCuenta: "activa", suscripcion: "activa" })).toThrow(CuentaNoSuspendida);
    expect(() => exigirReactivable({ id: "c", rol: "cliente", estadoCuenta: "suspendida", suscripcion: "activa" })).not.toThrow();
  });

  it("los contenedores arrancan solo con la suscripción vigente", () => {
    expect(["activa", "por-vencer", "vencida", null].map(reanudaContenedores)).toEqual([true, true, true, true]);
    expect(["suspendida", "cancelada"].map((e) => reanudaContenedores(e as "suspendida" | "cancelada"))).toEqual([false, false]);
  });
});
