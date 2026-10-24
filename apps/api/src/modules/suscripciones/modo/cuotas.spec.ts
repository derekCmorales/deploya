import { planesDePrueba } from "../adaptadores/planes.fixture";
import type { Suscripcion } from "../dominio/suscripcion";
import { CuotasDelPlan, LimitesDeInstalacion } from "./cuotas";
import { RepositorioConfiguracionInstalacionMemoria } from "./repositorio-configuracion-instalacion.memoria";

const [sandbox, starter] = planesDePrueba();

function suscripcion(cambios: Partial<Suscripcion> = {}): Suscripcion {
  return {
    id: "s1",
    usuarioId: "u1",
    plan: { ...sandbox, id: "plan-autoalojado", codigo: "autoalojado", nombre: "Autoalojado" },
    estado: "activa",
    estadoDesde: new Date("2026-10-20T00:00:00.000Z"),
    vigenciaDias: null,
    inicio: new Date("2026-10-20T00:00:00.000Z"),
    vence: null,
    planSiguiente: null,
    ...cambios,
  };
}

describe("SP-06 · PoliticaCuotas", () => {
  it("Límites de la instalación", async () => {
    const configuracion = new RepositorioConfiguracionInstalacionMemoria();
    configuracion.limitesGuardados = { cpuPorProyecto: 1, memoriaMbPorProyecto: 1024, proyectosPorUsuario: 5 };

    const cuota = await new LimitesDeInstalacion(configuracion).cuotaDe(suscripcion());

    expect(cuota).toEqual({
      plan: { codigo: "autoalojado", nombre: "Autoalojado" },
      estado: "activa",
      vence: null,
      maxProyectos: 5,
      cpus: 1,
      memoriaMb: 1024,
      construccionesMes: Number.POSITIVE_INFINITY,
    });
  });

  it("Sin límite de proyectos", async () => {
    const configuracion = new RepositorioConfiguracionInstalacionMemoria();
    configuracion.limitesGuardados = { cpuPorProyecto: 2, memoriaMbPorProyecto: 2048, proyectosPorUsuario: null };

    const cuota = await new LimitesDeInstalacion(configuracion).cuotaDe(suscripcion());

    expect(cuota.maxProyectos).toBe(Number.POSITIVE_INFINITY);
    expect(29 < cuota.maxProyectos).toBe(true);
  });

  it("los límites nuevos aplican en la próxima lectura (el próximo despliegue)", async () => {
    const configuracion = new RepositorioConfiguracionInstalacionMemoria();
    const politica = new LimitesDeInstalacion(configuracion);
    const antes = await politica.cuotaDe(suscripcion());
    configuracion.limitesGuardados = { ...configuracion.limitesGuardados, cpuPorProyecto: 0.5 };

    const despues = await politica.cuotaDe(suscripcion());

    expect([antes.cpus, despues.cpus]).toEqual([1, 0.5]);
  });

  it("Nube por defecto: la cuota son las columnas del plan", async () => {
    const vence = new Date("2026-11-01T00:00:00.000Z");

    const cuota = await new CuotasDelPlan().cuotaDe(suscripcion({ plan: starter, vence }));

    expect(cuota).toMatchObject({ plan: { codigo: "starter" }, vence, maxProyectos: 3, cpus: 0.5, memoriaMb: 512, construccionesMes: 150 });
  });
});
