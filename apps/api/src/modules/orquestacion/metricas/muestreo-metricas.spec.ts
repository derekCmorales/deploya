import { RelojFijo } from "../../../compartido/reloj";
import { MuestrasMetricasMemoria } from "../../../adapters/memoria/muestras-metricas.memoria";
import { RepositorioDesplieguesMemoria } from "../../../adapters/memoria/repositorio-despliegues.memoria";
import { MetricasContenedorStub } from "../../../adapters/stubs/metricas-contenedor.stub";
import type { EstadoDespliegue } from "../../construccion/dominio/estados";
import type { NuevoDespliegue } from "../../construccion/puertos/repositorio-despliegues.puerto";
import { MuestraIlegible } from "./dominio/errores";
import { CADA_MS_MUESTREO, programacionMuestreo, RETENCION_MUESTRAS_MS } from "./metricas.constantes";
import { ColaMuestreoMemoria } from "./cola-muestreo.memoria";
import { MuestreoMetricas } from "./muestreo-metricas";
import { TareaMuestreoMetricas } from "./tarea-muestreo";

const AHORA = new Date("2026-10-20T17:00:00.000Z");
const PROYECTO = "api-tienda";
const HORA_MS = 60 * 60 * 1000;

function alta(estado: EstadoDespliegue): NuevoDespliegue {
  return { proyectoId: PROYECTO, disparador: "manual", rama: "main", estado, creado: AHORA };
}

function armar() {
  const reloj = new RelojFijo(AHORA);
  const despliegues = new RepositorioDesplieguesMemoria();
  const muestras = new MuestrasMetricasMemoria();
  const metricas = new MetricasContenedorStub();
  const muestreo = new MuestreoMetricas(metricas, muestras, despliegues, reloj);
  return { reloj, despliegues, muestras, metricas, muestreo };
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
