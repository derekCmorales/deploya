import { RepositorioDesplieguesMemoria } from "../../../adapters/memoria/repositorio-despliegues.memoria";
import { ProyectosLecturaMemoria } from "../../../adapters/memoria/proyectos-lectura.memoria";
import { CuotaPlanStub } from "../../../adapters/stubs/cuota-plan.stub";
import { RelojFijo } from "../../../compartido/reloj";
import { proyectoDemo } from "../../../pruebas/motor";
import type { DisparadorDespliegue } from "../../construccion/dominio/estados";
import { CuotaProyectosPuerto, type CuotaProyectos } from "../../proyectos/puertos/cuota-proyectos.puerto";
import { SuscripcionNoEncontrada } from "../../suscripciones/dominio/errores";
import { ConsumoService } from "./consumo.service";

const USUARIO = "usuario-1";
const MAX_PROYECTOS = 3;
const CONSTRUCCIONES_MES = 150;

class CuotaProyectosFija extends CuotaProyectosPuerto {
  sinSuscripcion = false;

  async cuotaDe(usuarioId: string): Promise<CuotaProyectos> {
    if (this.sinSuscripcion) throw new SuscripcionNoEncontrada(usuarioId);
    return { plan: "Starter", maxProyectos: MAX_PROYECTOS, cpus: 0.5, memoriaMb: 512 };
  }
}

function escenario(hoy: string) {
  const despliegues = new RepositorioDesplieguesMemoria();
  const proyectos = new ProyectosLecturaMemoria();
  const cuotaPlan = new CuotaPlanStub();
  const cuotaProyectos = new CuotaProyectosFija();
  cuotaPlan.permiso = { estado: "activa", construccionesMes: CONSTRUCCIONES_MES };
  for (const id of ["proyecto-1", "proyecto-2", "proyecto-3"]) {
    proyectos.agregar(proyectoDemo({ id, subdominio: id }));
    despliegues.registrarDueno(id, USUARIO);
  }
  const servicio = new ConsumoService(new RelojFijo(new Date(hoy)), despliegues, proyectos, cuotaPlan, cuotaProyectos);

  async function desplegar(creado: string, cuantos = 1, disparador: DisparadorDespliegue = "manual") {
    for (let i = 0; i < cuantos; i++) {
      await despliegues.crear({ proyectoId: "proyecto-1", disparador, rama: "main", estado: "saludable", creado: new Date(creado) });
    }
  }

  return { servicio, cuotaProyectos, desplegar };
}

describe("Consumo del período (M7-03)", () => {
  it("Consumo cerca del límite", async () => {
    const { servicio, desplegar } = escenario("2026-10-14T12:00:00.000Z");
    await desplegar("2026-10-02T10:00:00.000Z", 96);

    const consumo = await servicio.de(USUARIO);

    expect(consumo.proyectos).toEqual({ usados: 3, limite: MAX_PROYECTOS });
    expect(consumo.construcciones).toEqual({ usadas: 96, limite: CONSTRUCCIONES_MES });
    expect(consumo.periodo).toEqual({
      desde: new Date("2026-10-01T00:00:00.000Z"),
      reinicia: new Date("2026-11-01T00:00:00.000Z"),
    });
  });

  it("Mes nuevo", async () => {
    const { servicio, desplegar } = escenario("2026-10-01T00:00:00.000Z");
    await desplegar("2026-09-30T23:59:59.000Z", 28);

    const consumo = await servicio.de(USUARIO);

    expect(consumo.construcciones.usadas).toBe(0);
    expect(consumo.periodo.reinicia).toEqual(new Date("2026-11-01T00:00:00.000Z"));
  });

  it("la reversión no suma construcciones", async () => {
    const { servicio, desplegar } = escenario("2026-10-14T12:00:00.000Z");
    await desplegar("2026-10-02T10:00:00.000Z");
    await desplegar("2026-10-03T10:00:00.000Z", 1, "reversion");

    const consumo = await servicio.de(USUARIO);

    expect(consumo.construcciones.usadas).toBe(1);
  });

  it("sin suscripción propaga SuscripcionNoEncontrada (el filtro de M2 la vuelve 404)", async () => {
    const { servicio, cuotaProyectos } = escenario("2026-10-14T12:00:00.000Z");
    cuotaProyectos.sinSuscripcion = true;

    await expect(servicio.de(USUARIO)).rejects.toThrow(SuscripcionNoEncontrada);
  });
});

describe("Ritmo diario de construcciones (SP-15)", () => {
  it("la reversión no cuenta", async () => {
    const { servicio, desplegar } = escenario("2026-10-14T12:00:00.000Z");
    await desplegar("2026-10-02T10:00:00.000Z");
    await desplegar("2026-10-03T10:00:00.000Z", 1, "reversion");

    const diario = await servicio.diario(USUARIO);

    expect(diario.desde).toBe("2026-10-01T00:00:00.000Z");
    expect(diario.reinicia).toBe("2026-11-01T00:00:00.000Z");
    expect(diario.cuota).toBe(CONSTRUCCIONES_MES);
    expect(diario.diarios).toHaveLength(14);
    expect(diario.diarios[1]).toBe(1);
    expect(diario.diarios[2]).toBe(0);
    expect(diario.diarios.reduce((total, dia) => total + dia, 0)).toBe(1);
  });

  it("sum(diarios) coincide con las construcciones usadas del período", async () => {
    const { servicio, desplegar } = escenario("2026-10-14T12:00:00.000Z");
    await desplegar("2026-10-02T10:00:00.000Z", 3);
    await desplegar("2026-10-09T10:00:00.000Z", 2);

    const [consumo, diario] = await Promise.all([servicio.de(USUARIO), servicio.diario(USUARIO)]);

    expect(diario.diarios.reduce((total, dia) => total + dia, 0)).toBe(consumo.construcciones.usadas);
  });
});
