import { RepositorioDesplieguesMemoria } from "../../../adapters/memoria/repositorio-despliegues.memoria";
import { ProyectoNoEncontrado } from "../../construccion/dominio/errores";
import type { Etapa } from "../../construccion/dominio/estados";
import type { NuevoDespliegue } from "../../construccion/puertos/repositorio-despliegues.puerto";
import { DetalleProyectoPuerto, type DetalleProyecto } from "../puertos/detalle-proyecto.puerto";
import { TiemposController } from "./tiempos.controller";
import { TiemposService, ultimosDe } from "./tiempos.service";

const PROYECTO = "api-tienda";
const DUENO = "usuario-1";
const CREADO = new Date("2026-10-20T12:00:00.000Z");
const SEGUNDO_MS = 1000;

const DETALLE: DetalleProyecto = {
  id: PROYECTO,
  usuarioId: DUENO,
  nombre: "api-tienda",
  subdominio: "api-tienda",
  urlRepositorio: "https://github.com/derekCmorales/api-tienda",
  rama: "main",
  puertoInterno: 8080,
};

class DetalleFijo extends DetalleProyectoPuerto {
  constructor(private readonly proyecto: DetalleProyecto | null) {
    super();
  }

  async porId(proyectoId: string): Promise<DetalleProyecto | null> {
    return this.proyecto?.id === proyectoId ? this.proyecto : null;
  }
}

function alta(extra: Partial<NuevoDespliegue> = {}): NuevoDespliegue {
  return { proyectoId: PROYECTO, disparador: "manual", rama: "main", estado: "encolado", creado: CREADO, ...extra };
}

async function durar(
  repositorio: RepositorioDesplieguesMemoria,
  despliegueId: string,
  etapa: Etapa,
  inicioMs: number,
  finMs: number,
  fallida = false,
): Promise<void> {
  await repositorio.marcarEtapa(despliegueId, etapa, "en-curso", new Date(CREADO.getTime() + inicioMs));
  await repositorio.marcarEtapa(despliegueId, etapa, fallida ? "fallida" : "completada", new Date(CREADO.getTime() + finMs));
}

/** Un Saludable cuya única etapa medida es Recepción: el total del despliegue es `totalMs`. */
async function saludable(repositorio: RepositorioDesplieguesMemoria, totalMs: number): Promise<void> {
  const despliegue = await repositorio.crear(alta());
  await durar(repositorio, despliegue.id, "recepcion", 0, totalMs);
  await repositorio.cambiarEstado(despliegue.id, "saludable");
}

function armar(proyecto: DetalleProyecto | null = DETALLE) {
  const despliegues = new RepositorioDesplieguesMemoria();
  const servicio = new TiemposService(new DetalleFijo(proyecto), despliegues);
  return { despliegues, servicio };
}

describe("SP-14 · Tiempo por etapa", () => {
  it("Mediana", async () => {
    const { despliegues, servicio } = armar();
    for (let i = 1; i <= 11; i += 1) await saludable(despliegues, i * 10 * SEGUNDO_MS);

    const fallido = await despliegues.crear(alta());
    await durar(despliegues, fallido.id, "recepcion", 0, 900 * SEGUNDO_MS);
    await despliegues.cambiarEstado(fallido.id, "fallido");

    const reversion = await despliegues.crear(alta({ disparador: "reversion", etapasOmitidas: ["recepcion", "construccion"] }));
    await durar(despliegues, reversion.id, "ejecucion", 0, 800 * SEGUNDO_MS);
    await despliegues.cambiarEstado(reversion.id, "saludable");

    const respuesta = await servicio.leer(PROYECTO, DUENO);

    expect(respuesta.despliegues).toHaveLength(13);
    expect(respuesta.resumen.medianaMs).toBe(60 * SEGUNDO_MS);
    expect(respuesta.resumen.fallos).toEqual({ fallidos: 1, total: 13 });
  });

  it("Dónde falló", async () => {
    const { despliegues, servicio } = armar();
    for (let i = 1; i <= 10; i += 1) await saludable(despliegues, i * SEGUNDO_MS);

    const fallido = await despliegues.crear(alta());
    await durar(despliegues, fallido.id, "recepcion", 0, 4 * SEGUNDO_MS);
    await durar(despliegues, fallido.id, "construccion", 4 * SEGUNDO_MS, 9 * SEGUNDO_MS, true);
    await durar(despliegues, fallido.id, "ejecucion", 9 * SEGUNDO_MS, 20 * SEGUNDO_MS);
    await despliegues.cambiarEstado(fallido.id, "fallido");

    const respuesta = await servicio.leer(PROYECTO, DUENO);
    const once = respuesta.despliegues.find((fila) => fila.numero === 11);

    expect(fallido.numero).toBe(11);
    expect(once?.falloEn).toBe("construccion");
    expect(once?.etapas.construccion).toBe(5 * SEGUNDO_MS);
    expect(once?.etapas.ejecucion).toBe(0);
    expect(once?.etapas.enrutamiento).toBe(0);
    expect(once?.etapas.operacion).toBe(0);
  });

  it("Reversión", async () => {
    const { despliegues, servicio } = armar();
    for (let i = 1; i <= 6; i += 1) await saludable(despliegues, i * SEGUNDO_MS);

    const reversion = await despliegues.crear(alta({ disparador: "reversion", etapasOmitidas: ["recepcion", "construccion"] }));
    await durar(despliegues, reversion.id, "ejecucion", 0, 21 * SEGUNDO_MS);
    await durar(despliegues, reversion.id, "enrutamiento", 21 * SEGUNDO_MS, 30 * SEGUNDO_MS);
    await durar(despliegues, reversion.id, "operacion", 30 * SEGUNDO_MS, 48 * SEGUNDO_MS);
    await despliegues.cambiarEstado(reversion.id, "saludable");

    const respuesta = await servicio.leer(PROYECTO, DUENO);
    const siete = respuesta.despliegues.find((fila) => fila.numero === 7);

    expect(reversion.numero).toBe(7);
    expect(siete?.reversion).toBe(true);
    expect(siete?.etapas.recepcion).toBe(0);
    expect(siete?.etapas.construccion).toBe(0);
    expect(siete?.etapas.ejecucion).toBe(21 * SEGUNDO_MS);
    expect(respuesta.resumen.ultimaReversion).toEqual({ numero: 7, ms: 48 * SEGUNDO_MS });
  });

  it("un proyecto ajeno o inexistente es 404", async () => {
    const ajeno = armar({ ...DETALLE, usuarioId: "otro" });

    await expect(ajeno.servicio.leer(PROYECTO, DUENO)).rejects.toBeInstanceOf(ProyectoNoEncontrado);
    await expect(armar(null).servicio.leer(PROYECTO, DUENO)).rejects.toBeInstanceOf(ProyectoNoEncontrado);
  });

  it("el controlador pide los últimos 14 despliegues al servicio", async () => {
    const { despliegues, servicio } = armar();
    for (let i = 1; i <= 15; i += 1) await saludable(despliegues, i * SEGUNDO_MS);
    const controlador = new TiemposController(servicio);

    const respuesta = await controlador.tiemposDe(PROYECTO, undefined, DUENO);

    expect(respuesta.despliegues).toHaveLength(14);
    expect(respuesta.despliegues[0].numero).toBe(2);
    expect(respuesta.despliegues.at(-1)?.numero).toBe(15);
    expect(ultimosDe("3")).toBe(3);
    expect(ultimosDe("99")).toBe(14);
    expect(ultimosDe("0")).toBe(14);
    expect(ultimosDe(undefined)).toBe(14);
  });
});
