import { AsignacionSandboxSuscripciones } from "../identidad/adaptadores/asignacion-sandbox.suscripciones";
import { CuotaPlanSuscripciones } from "../orquestacion/adaptadores/cuota-plan.suscripciones";
import { CuotaProyectosSuscripciones } from "../proyectos/adaptadores/cuota-proyectos.suscripciones";
import type { Cuota } from "./dominio/suscripcion";
import type { SuscripcionesService } from "./suscripciones.service";

const CUOTA_PRO: Cuota = {
  plan: { codigo: "pro", nombre: "Pro" },
  estado: "activa",
  vence: null,
  maxProyectos: 10,
  cpus: 1,
  memoriaMb: 1024,
  construccionesMes: 500,
};

function facadeFalsa() {
  return {
    cuotaDe: jest.fn().mockResolvedValue(CUOTA_PRO),
    asignarSandbox: jest.fn().mockResolvedValue(undefined),
  };
}

describe("Adaptadores de M1, M3 y M5 sobre la Facade de M2", () => {
  it("M1: el registro asigna Sandbox a través de SuscripcionesService", async () => {
    const facade = facadeFalsa();
    await new AsignacionSandboxSuscripciones(facade as unknown as SuscripcionesService).asignarSandbox("u-1");
    expect(facade.asignarSandbox).toHaveBeenCalledWith("u-1");
  });

  it("M3: la lista usa el límite de proyectos y los recursos del plan", async () => {
    const cuota = await new CuotaProyectosSuscripciones(facadeFalsa() as unknown as SuscripcionesService).cuotaDe("u-1");
    expect(cuota).toEqual({ plan: "Pro", maxProyectos: 10, cpus: 1, memoriaMb: 1024 });
  });

  it("M5: el contenedor recibe los --cpus y --memory del plan", async () => {
    const recursos = await new CuotaPlanSuscripciones(facadeFalsa() as unknown as SuscripcionesService).recursosDe("u-1");
    expect(recursos).toEqual({ plan: "pro", cpus: 1, memoriaMb: 1024 });
  });

  it("M5: los bloqueos leen el estado y las construcciones del mes", async () => {
    const permiso = await new CuotaPlanSuscripciones(facadeFalsa() as unknown as SuscripcionesService).permisoDe("u-1");
    expect(permiso).toEqual({ estado: "activa", construccionesMes: 500 });
  });
});
