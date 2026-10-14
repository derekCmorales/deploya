import type { Cuota } from "../../suscripciones/dominio/suscripcion";
import type { SuscripcionesService } from "../../suscripciones/suscripciones.service";
import { CuotaPlanSuscripciones } from "./cuota-plan.suscripciones";

const CUOTA_STARTER: Cuota = {
  plan: { codigo: "starter", nombre: "Starter" },
  estado: "activa",
  vence: null,
  maxProyectos: 3,
  cpus: 0.5,
  memoriaMb: 512,
  construccionesMes: 100,
};

describe("CuotaPlanSuscripciones.planDe (M7-02)", () => {
  it("la pantalla 13 recibe el código y el nombre del plan, sin el resto de la cuota", async () => {
    const facade = { cuotaDe: jest.fn().mockResolvedValue(CUOTA_STARTER) };

    const plan = await new CuotaPlanSuscripciones(facade as unknown as SuscripcionesService).planDe("u-1");

    expect(plan).toEqual({ codigo: "starter", nombre: "Starter" });
    expect(facade.cuotaDe).toHaveBeenCalledWith("u-1");
  });
});
