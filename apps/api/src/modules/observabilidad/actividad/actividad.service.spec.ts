import { DetalleProyectoMemoria } from "../../../adapters/memoria/detalle-proyecto.memoria";
import { RepositorioDesplieguesMemoria } from "../../../adapters/memoria/repositorio-despliegues.memoria";
import { RelojFijo } from "../../../compartido/reloj";
import { ProyectoNoEncontrado } from "../../construccion/dominio/errores";
import type { DisparadorDespliegue, EstadoDespliegue } from "../../construccion/dominio/estados";
import { DIAS_ACTIVIDAD } from "../dominio/actividad";
import { ActividadService } from "./actividad.service";

const HOY = new Date("2026-10-14T18:30:00.000Z");

function escenario() {
  const despliegues = new RepositorioDesplieguesMemoria();
  const detalles = new DetalleProyectoMemoria();
  detalles.agregar({
    id: "proyecto-1",
    usuarioId: "usuario-1",
    nombre: "hola-deploya",
    subdominio: "hola-deploya",
    urlRepositorio: "https://github.com/derekCmorales/hola-deploya",
    rama: "main",
    puertoInterno: 8080,
  });
  const servicio = new ActividadService(new RelojFijo(HOY), despliegues, detalles);

  async function desplegar(creado: string, estado: EstadoDespliegue, disparador: DisparadorDespliegue = "manual") {
    await despliegues.crear({ proyectoId: "proyecto-1", disparador, rama: "main", estado, creado: new Date(creado) });
  }

  return { servicio, desplegar };
}

describe("Actividad del proyecto (M7-03)", () => {
  it("Actividad de 12 semanas", async () => {
    const { servicio, desplegar } = escenario();
    for (let i = 0; i < 36; i++) await desplegar(`2026-10-${String(1 + (i % 10)).padStart(2, "0")}T12:00:00.000Z`, "saludable");
    await desplegar("2026-10-10T09:00:00.000Z", "fallido");
    await desplegar("2026-10-14T15:00:00.000Z", "fallido");

    const actividad = await servicio.de("proyecto-1", "usuario-1");

    expect(actividad.dias).toHaveLength(DIAS_ACTIVIDAD);
    expect(actividad.total).toBe(38);
    expect(actividad.fallidos).toBe(2);
    expect(actividad.dias.at(-1)).toEqual({ fecha: "2026-10-14", total: 1, fallidos: 1 });
  });

  it("deja fuera lo anterior a la ventana y cuenta las reversiones como despliegues", async () => {
    const { servicio, desplegar } = escenario();
    await desplegar("2026-07-22T23:59:59.000Z", "saludable");
    await desplegar("2026-10-13T10:00:00.000Z", "saludable", "reversion");

    const actividad = await servicio.de("proyecto-1", "usuario-1");

    expect(actividad.total).toBe(1);
  });

  it("un proyecto ajeno o inexistente es 404", async () => {
    const { servicio } = escenario();

    await expect(servicio.de("proyecto-1", "otro-usuario")).rejects.toThrow(ProyectoNoEncontrado);
    await expect(servicio.de("no-existe", "usuario-1")).rejects.toThrow(ProyectoNoEncontrado);
  });
});
