import { RelojFijo } from "../../../compartido/reloj";
import { MuestrasMetricasMemoria } from "../../../adapters/memoria/muestras-metricas.memoria";
import { RepositorioDesplieguesMemoria } from "../../../adapters/memoria/repositorio-despliegues.memoria";
import { MetricasContenedorStub } from "../../../adapters/stubs/metricas-contenedor.stub";
import type { EstadoDespliegue } from "../../construccion/dominio/estados";
import type { NuevoDespliegue } from "../../construccion/puertos/repositorio-despliegues.puerto";
import type { MuestraContenedor } from "../puertos/metricas-contenedor.puerto";
import { MuestraIlegible } from "./dominio/errores";
import { CADA_MS_MUESTREO, CONTENEDORES_EN_PARALELO, programacionMuestreo, RETENCION_MUESTRAS_MS } from "./metricas.constantes";
import { ColaMuestreoMemoria } from "./cola-muestreo.memoria";
import { MuestreoMetricas } from "./muestreo-metricas";
import { TareaMuestreoMetricas } from "./tarea-muestreo";

const AHORA = new Date("2026-10-20T17:00:00.000Z");
const PROYECTO = "api-tienda";
const HORA_MS = 60 * 60 * 1000;

function alta(estado: EstadoDespliegue, proyectoId: string = PROYECTO): NuevoDespliegue {
  return { proyectoId, disparador: "manual", rama: "main", estado, creado: AHORA };
}

function armar() {
  const reloj = new RelojFijo(AHORA);
  const despliegues = new RepositorioDesplieguesMemoria();
  const muestras = new MuestrasMetricasMemoria();
  const metricas = new MetricasContenedorStub();
  const muestreo = new MuestreoMetricas(metricas, muestras, despliegues, reloj);
  return { reloj, despliegues, muestras, metricas, muestreo };
}

async function publicarProyectos(
  despliegues: RepositorioDesplieguesMemoria,
  muestras: MuestrasMetricasMemoria,
  total: number,
): Promise<void> {
  for (let indice = 0; indice < total; indice += 1) {
    const proyectoId = `${PROYECTO}-${indice}`;
    const despliegue = await despliegues.crear(alta("saludable", proyectoId));
    await despliegues.cambiarEstado(despliegue.id, "saludable", { contenedorId: `contenedor-${indice}` });
    await despliegues.marcarActivo(proyectoId, despliegue.id);
    muestras.vincular(despliegue.id, proyectoId, despliegue.numero);
  }
}

/** Doble que cuenta cuántas lecturas están a medias a la vez; cede el turno una vez por lectura. */
class MedidorConcurrente {
  readonly pedidos: string[] = [];
  maximoEnVuelo = 0;
  private enVuelo = 0;

  async medir(contenedorId: string): Promise<MuestraContenedor> {
    this.pedidos.push(contenedorId);
    this.enVuelo += 1;
    this.maximoEnVuelo = Math.max(this.maximoEnVuelo, this.enVuelo);
    await Promise.resolve();
    this.enVuelo -= 1;
    return { cpu: 0.1, memoriaMb: 100 };
  }
}

describe("Muestreo de métricas (SP-07)", () => {
  it("el programador corre cada 60 s", () => {
    expect(CADA_MS_MUESTREO).toBe(60_000);
    expect(programacionMuestreo()).toEqual({ every: CADA_MS_MUESTREO });
  });

  it("Muestra de un contenedor Saludable", async () => {
    const { despliegues, muestras, metricas, muestreo } = armar();
    const despliegue = await despliegues.crear(alta("saludable"));
    await despliegues.cambiarEstado(despliegue.id, "saludable", { contenedorId: "contenedor-api" });
    await despliegues.marcarActivo(PROYECTO, despliegue.id);
    muestras.vincular(despliegue.id, PROYECTO, despliegue.numero);

    await muestreo.correr();

    const guardadas = await muestras.deProyecto(PROYECTO, new Date(0));
    expect(metricas.pedidos).toEqual(["contenedor-api"]);
    expect(guardadas).toEqual([
      { despliegueId: despliegue.id, tomada: AHORA, cpu: 0.12, memoriaMb: 430, version: despliegue.numero },
    ]);
  });

  it("Un Detenido no se muestrea", async () => {
    const { despliegues, muestras, metricas, muestreo } = armar();
    const despliegue = await despliegues.crear(alta("detenido"));
    await despliegues.cambiarEstado(despliegue.id, "detenido", { contenedorId: "contenedor-api" });
    await despliegues.marcarActivo(PROYECTO, despliegue.id);

    await muestreo.correr();

    expect(metricas.pedidos).toEqual([]);
    expect(await muestras.deProyecto(PROYECTO, new Date(0))).toEqual([]);
  });

  it("Un despliegue en curso no se muestrea", async () => {
    const { despliegues, muestras, metricas, muestreo } = armar();
    const despliegue = await despliegues.crear(alta("construyendo"));
    await despliegues.cambiarEstado(despliegue.id, "construyendo", { contenedorId: "contenedor-api" });
    await despliegues.marcarActivo(PROYECTO, despliegue.id);

    await muestreo.correr();

    expect(metricas.pedidos).toEqual([]);
    expect(await muestras.deProyecto(PROYECTO, new Date(0))).toEqual([]);
  });

  it("un contenedor ilegible no guarda muestra ni detiene la purga", async () => {
    const { reloj, despliegues, muestras, metricas, muestreo } = armar();
    const despliegue = await despliegues.crear(alta("saludable"));
    await despliegues.cambiarEstado(despliegue.id, "saludable", { contenedorId: "roto" });
    await despliegues.marcarActivo(PROYECTO, despliegue.id);
    muestras.vincular(despliegue.id, PROYECTO, despliegue.numero);
    muestras.vincular("vieja", PROYECTO, 1);
    await muestras.guardar({
      despliegueId: "vieja",
      tomada: new Date(reloj.ahora().getTime() - RETENCION_MUESTRAS_MS - HORA_MS),
      cpu: 0.1,
      memoriaMb: 10,
    });
    metricas.muestra = () => Promise.reject(new MuestraIlegible("stats vacío"));

    await expect(muestreo.correr()).resolves.toBeUndefined();

    expect(await muestras.deProyecto(PROYECTO, new Date(0))).toEqual([]);
  });

  it("con más contenedores que el lote se muestrean todos sin pasar de la concurrencia acotada", async () => {
    const { despliegues, muestras, metricas, muestreo } = armar();
    const total = CONTENEDORES_EN_PARALELO * 2 + 1;
    await publicarProyectos(despliegues, muestras, total);
    const medidor = new MedidorConcurrente();
    metricas.muestra = (contenedorId) => medidor.medir(contenedorId);

    await muestreo.correr();

    expect(medidor.pedidos).toHaveLength(total);
    expect(await muestras.deProyecto(`${PROYECTO}-0`, new Date(0))).toHaveLength(1);
    expect(await muestras.deProyecto(`${PROYECTO}-${total - 1}`, new Date(0))).toHaveLength(1);
    expect(medidor.maximoEnVuelo).toBe(CONTENEDORES_EN_PARALELO);
  });

  it("un contenedor ilegible entre varios no frena al resto del lote", async () => {
    const { despliegues, muestras, metricas, muestreo } = armar();
    const total = CONTENEDORES_EN_PARALELO + 2;
    await publicarProyectos(despliegues, muestras, total);
    const medidor = new MedidorConcurrente();
    metricas.muestra = (contenedorId) =>
      contenedorId === "contenedor-1" ? Promise.reject(new MuestraIlegible("stats vacío")) : medidor.medir(contenedorId);

    await muestreo.correr();

    const guardadas = await Promise.all(
      Array.from({ length: total }, (_, indice) => muestras.deProyecto(`${PROYECTO}-${indice}`, new Date(0))),
    );
    expect(guardadas.flat()).toHaveLength(total - 1);
    expect(guardadas[1]).toEqual([]);
  });

  it("Purga de 24 h", async () => {
    const { reloj, muestras, muestreo } = armar();
    const hace25h = new Date(reloj.ahora().getTime() - RETENCION_MUESTRAS_MS - HORA_MS);
    const hace1h = new Date(reloj.ahora().getTime() - HORA_MS);
    muestras.vincular("vieja", PROYECTO, 1);
    muestras.vincular("reciente", PROYECTO, 1);
    await muestras.guardar({ despliegueId: "vieja", tomada: hace25h, cpu: 0.1, memoriaMb: 10 });
    await muestras.guardar({ despliegueId: "reciente", tomada: hace1h, cpu: 0.2, memoriaMb: 20 });

    await muestreo.correr();

    const quedan = await muestras.deProyecto(PROYECTO, new Date(0));
    expect(quedan.map((muestra) => muestra.despliegueId)).toEqual(["reciente"]);
  });

  it("al arrancar el trabajador programa el tick y cada corrida muestrea", async () => {
    const { despliegues, muestras, muestreo } = armar();
    const despliegue = await despliegues.crear(alta("saludable"));
    await despliegues.cambiarEstado(despliegue.id, "saludable", { contenedorId: "c1" });
    await despliegues.marcarActivo(PROYECTO, despliegue.id);
    muestras.vincular(despliegue.id, PROYECTO, despliegue.numero);
    const cola = new ColaMuestreoMemoria();
    const tarea = new TareaMuestreoMetricas(cola, muestreo);

    await tarea.onApplicationBootstrap();
    await cola.correr();
    await tarea.onModuleDestroy();

    expect(cola.programada).toBe(false);
    expect(await muestras.deProyecto(PROYECTO, new Date(0))).toHaveLength(1);
    await expect(cola.correr()).rejects.toThrow("no está programada");
  });
});
