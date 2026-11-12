import { DatosSolicitudInvalidos } from "./errores";
import { confirmacionSolicitada, destinoSolicitado, tipoSolicitado } from "./solicitudes";

describe("Cuerpos de los recursos de datos", () => {
  it("tipo: postgres, redis o s3; otro valor o sin cuerpo es DATOS_INVALIDOS", () => {
    expect(tipoSolicitado({ tipo: "redis" })).toBe("redis");
    expect(() => tipoSolicitado({ tipo: "mysql" })).toThrow(DatosSolicitudInvalidos);
    expect(() => tipoSolicitado(undefined)).toThrow(DatosSolicitudInvalidos);
  });

  it("compartir pide un proyectoId no vacío", () => {
    expect(destinoSolicitado({ proyectoId: " p-2 " })).toBe("p-2");
    expect(() => destinoSolicitado({ proyectoId: "" })).toThrow(DatosSolicitudInvalidos);
    expect(() => destinoSolicitado({})).toThrow(DatosSolicitudInvalidos);
  });

  it("la confirmación es texto; otra cosa cuenta como vacía", () => {
    expect(confirmacionSolicitada({ confirmacion: "s3" })).toBe("s3");
    expect(confirmacionSolicitada({ confirmacion: 3 })).toBe("");
  });
});
