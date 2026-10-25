import { CuentaYaSuspendida, DetalleInvalido, MotivoInvalido, NoSePuedeSuspenderAdministrador } from "./errores";
import { DETALLE_MAXIMO, exigirSuspendible, MOTIVOS_SUSPENSION, validarSolicitudSuspension } from "./suspension";

describe("M9-02 · reglas de la suspensión", () => {
  it("el motivo «terminos» es el texto que muestra 03b", () => {
    expect(MOTIVOS_SUSPENSION.terminos).toBe("Uso que incumple los términos de servicio.");
  });

  it("acepta un motivo de la lista con su detalle recortado", () => {
    const solicitud = validarSolicitudSuspension({ motivo: "terminos", detalle: "  Tráfico de minería detectado en 2 contenedores. " });

    expect(solicitud).toEqual({ motivo: "terminos", detalle: "Tráfico de minería detectado en 2 contenedores." });
  });

  it("el detalle es opcional", () => {
    expect(validarSolicitudSuspension({ motivo: "abuso-recursos" })).toEqual({ motivo: "abuso-recursos", detalle: null });
  });

  it("Motivo fuera de la lista", () => {
    expect(() => validarSolicitudSuspension({ motivo: "me cae mal" })).toThrow(MotivoInvalido);
    expect(() => validarSolicitudSuspension({ motivo: "toString" })).toThrow(MotivoInvalido);
    expect(() => validarSolicitudSuspension(null)).toThrow(MotivoInvalido);
  });

  it("detalle de más de 500 caracteres o que no es texto", () => {
    expect(() => validarSolicitudSuspension({ motivo: "terminos", detalle: "x".repeat(DETALLE_MAXIMO + 1) })).toThrow(DetalleInvalido);
    expect(() => validarSolicitudSuspension({ motivo: "terminos", detalle: 42 })).toThrow(DetalleInvalido);
  });

  it("no se suspende a un administrador ni dos veces la misma cuenta", () => {
    expect(() => exigirSuspendible({ id: "a", rol: "administrador", estadoCuenta: "activa", suscripcion: null })).toThrow(NoSePuedeSuspenderAdministrador);
    expect(() => exigirSuspendible({ id: "c", rol: "cliente", estadoCuenta: "suspendida", suscripcion: "activa" })).toThrow(CuentaYaSuspendida);
    expect(() => exigirSuspendible({ id: "c", rol: "cliente", estadoCuenta: "activa", suscripcion: "activa" })).not.toThrow();
  });
});
