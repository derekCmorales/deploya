import { RepositorioDesplieguesMemoria } from "../../../adapters/memoria/repositorio-despliegues.memoria";
import type { Etapa } from "./estados";
import type { NuevoDespliegue } from "../puertos/repositorio-despliegues.puerto";
import { DURACION_OMITIDA_MS } from "./tiempos-despliegue";

const PROYECTO = "api-tienda";
const CREADO = new Date("2026-10-20T12:00:00.000Z");
const ULTIMOS = 14;
const MS = 1000;

function alta(extra: Partial<NuevoDespliegue> = {}): NuevoDespliegue {
  return { proyectoId: PROYECTO, disparador: "manual", rama: "main", estado: "encolado", creado: CREADO, ...extra };
}

async function anteriores(repo: RepositorioDesplieguesMemoria, cantidad: number): Promise<void> {
  for (let i = 0; i < cantidad; i += 1) await repo.crear(alta());
}

async function durar(repo: RepositorioDesplieguesMemoria, id: string, etapa: Etapa, inicioMs: number, finMs: number, fallida = false): Promise<void> {
  await repo.marcarEtapa(id, etapa, "en-curso", new Date(inicioMs));
  await repo.marcarEtapa(id, etapa, fallida ? "fallida" : "completada", new Date(finMs));
}

describe("Tiempos por etapa (SP-07)", () => {
  it("Reversión sin construcción", async () => {
    const repo = new RepositorioDesplieguesMemoria();
    await anteriores(repo, 6);
    const reversion = await repo.crear(alta({ disparador: "reversion", etapasOmitidas: ["recepcion", "construccion"], estado: "revirtiendo" }));
    await durar(repo, reversion.id, "ejecucion", 0, 21 * MS);
    await durar(repo, reversion.id, "enrutamiento", 21 * MS, 30 * MS);
    await durar(repo, reversion.id, "operacion", 30 * MS, 48 * MS);
    await repo.cambiarEstado(reversion.id, "saludable");

    const tiempos = await repo.tiemposDe(PROYECTO, ULTIMOS);
    const siete = tiempos.find((fila) => fila.numero === 7);

    expect(reversion.numero).toBe(7);
    expect(siete).toMatchObject({
      numero: 7,
      reversion: true,
      falloEn: null,
      etapas: { recepcion: DURACION_OMITIDA_MS, construccion: DURACION_OMITIDA_MS, ejecucion: 21 * MS, enrutamiento: 9 * MS, operacion: 18 * MS },
    });
  });

  it("Fallido en Construcción", async () => {
    const repo = new RepositorioDesplieguesMemoria();
    await anteriores(repo, 10);
    const fallido = await repo.crear(alta());
    await durar(repo, fallido.id, "recepcion", 0, 4 * MS);
    await durar(repo, fallido.id, "construccion", 4 * MS, 9 * MS, true);
    await durar(repo, fallido.id, "ejecucion", 9 * MS, 20 * MS);
    await repo.cambiarEstado(fallido.id, "fallido");

    const tiempos = await repo.tiemposDe(PROYECTO, ULTIMOS);
    const once = tiempos.find((fila) => fila.numero === 11);

    expect(fallido.numero).toBe(11);
    expect(once?.falloEn).toBe("construccion");
    expect(once).toMatchObject({
      numero: 11,
      reversion: false,
      falloEn: "construccion",
      etapas: {
        recepcion: 4 * MS,
        construccion: 5 * MS,
        ejecucion: DURACION_OMITIDA_MS,
        enrutamiento: DURACION_OMITIDA_MS,
        operacion: DURACION_OMITIDA_MS,
      },
    });
  });

  it("un Fallido sin etapa marcada no inventa falloEn", async () => {
    const repo = new RepositorioDesplieguesMemoria();
    const fallido = await repo.crear(alta());
    await repo.cambiarEstado(fallido.id, "fallido");

    const [tiempos] = await repo.tiemposDe(PROYECTO, 1);

    expect(tiempos.falloEn).toBeNull();
    expect(tiempos.etapas.recepcion).toBe(DURACION_OMITIDA_MS);
  });
});
