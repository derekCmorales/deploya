import { RelojFijo } from "../../../compartido/reloj";
import { planesDePrueba } from "../adaptadores/planes.fixture";
import { RepositorioSuscripcionesMemoria } from "../adaptadores/repositorio-suscripciones.memoria";
import { CicloSuscripcionService } from "./ciclo-suscripcion.service";
import { PATRON_CICLO, ZONA_CICLO } from "./ciclo.constantes";
import { ColaCicloMemoria } from "./cola-ciclo.memoria";
import { ContenedoresClienteFalso } from "./contenedores-cliente.falso";
import { TareaCicloDiaria } from "./tarea-ciclo-diaria";

describe("M2-05 · TareaCicloDiaria", () => {
  async function armar() {
    const suscripciones = new RepositorioSuscripcionesMemoria(planesDePrueba());
    await suscripciones.crearSiNoExiste({
      usuarioId: "u1",
      planId: "plan-starter",
      estado: "activa",
      vigenciaDias: 30,
      inicio: new Date("2026-10-01T00:05:00.000Z"),
      vence: new Date("2026-10-31T00:05:00.000Z"),
    });
    const ciclo = new CicloSuscripcionService(suscripciones, new ContenedoresClienteFalso(), new RelojFijo(new Date("2026-10-24T00:05:00.000Z")));
    const cola = new ColaCicloMemoria();
    return { tarea: new TareaCicloDiaria(cola, ciclo), cola, suscripciones };
  }

  it("corre todos los días a las 00:05 UTC", () => {
    expect([PATRON_CICLO, ZONA_CICLO]).toEqual(["5 0 * * *", "UTC"]);
  });

  it("al arrancar el trabajador programa la tarea y cada corrida ejecuta el ciclo", async () => {
    const { tarea, cola, suscripciones } = await armar();

    await tarea.onApplicationBootstrap();
    await cola.correr();

    expect(cola.programada).toBe(true);
    await expect(suscripciones.deUsuario("u1")).resolves.toMatchObject({ estado: "por-vencer" });
  });

  it("al cerrar el trabajador deja de consumir", async () => {
    const { tarea, cola } = await armar();
    await tarea.onApplicationBootstrap();

    await tarea.onModuleDestroy();

    expect(cola.programada).toBe(false);
    await expect(cola.correr()).rejects.toThrow("no está programada");
  });
});
