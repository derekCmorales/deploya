import { SoloSeReintentaUnFallido, YaNoSePuedeCancelar } from "./errores";
import { ESTADOS_DESPLIEGUE, type EstadoDespliegue } from "./estados";
import { PoliticaAcciones } from "./politica-acciones";

const CANCELABLES: readonly EstadoDespliegue[] = ["encolado", "construyendo", "revirtiendo"];
const REINTENTABLES: readonly EstadoDespliegue[] = ["fallido"];

describe("PoliticaAcciones (M4-02)", () => {
  it.each(ESTADOS_DESPLIEGUE)("cancelar desde %s", (estado) => {
    const permitido = CANCELABLES.includes(estado);

    expect(PoliticaAcciones.permitida("cancelar", estado)).toBe(permitido);
    if (permitido) expect(() => PoliticaAcciones.exigirCancelable(estado)).not.toThrow();
    else expect(() => PoliticaAcciones.exigirCancelable(estado)).toThrow(YaNoSePuedeCancelar);
  });

  it.each(ESTADOS_DESPLIEGUE)("reintentar desde %s", (estado) => {
    const permitido = REINTENTABLES.includes(estado);

    expect(PoliticaAcciones.permitida("reintentar", estado)).toBe(permitido);
    if (permitido) expect(() => PoliticaAcciones.exigirReintentable(estado)).not.toThrow();
    else expect(() => PoliticaAcciones.exigirReintentable(estado)).toThrow(SoloSeReintentaUnFallido);
  });

  it("los rechazos llevan el código del contrato", () => {
    expect(new YaNoSePuedeCancelar("aprovisionando").codigo).toBe("ya-no-se-puede-cancelar");
    expect(new SoloSeReintentaUnFallido("saludable").codigo).toBe("solo-se-reintenta-un-fallido");
  });
});
