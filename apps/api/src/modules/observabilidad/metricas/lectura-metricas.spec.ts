import type { ArgumentsHost } from "@nestjs/common";
import { RelojFijo } from "../../../compartido/reloj";
import { MuestrasMetricasMemoria } from "../../../adapters/memoria/muestras-metricas.memoria";
import { RepositorioDesplieguesMemoria } from "../../../adapters/memoria/repositorio-despliegues.memoria";
import { CuotaPlanStub } from "../../../adapters/stubs/cuota-plan.stub";
import { ProyectoNoEncontrado } from "../../construccion/dominio/errores";
import type { NuevoDespliegue } from "../../construccion/puertos/repositorio-despliegues.puerto";
import { INTERVALO_PROMEDIO_MS, PUNTOS_SERIE_24H, VENTANA_24H_MS } from "../../orquestacion/metricas/metricas.constantes";
import { DetalleProyectoPuerto, type DetalleProyecto } from "../puertos/detalle-proyecto.puerto";
import { AVISO_CONTENEDOR_NO_CORRE } from "./dominio/serie-metricas";
import { ErroresMetricasFilter, rangoMetricas, MetricasProyectoController } from "./metricas-proyecto.controller";
import { RangoMetricasInvalido } from "./errores";
import { LecturaMetricasService } from "./lectura-metricas.service";

const AHORA = new Date("2026-10-20T18:10:00.000Z");
const ULTIMO_CUBO = new Date("2026-10-20T18:00:00.000Z");
const PROYECTO = "api-tienda";
const DUENO = "usuario-1";
const HORA_MS = 60 * 60 * 1000;
const MINUTO_MS = 60 * 1000;

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

function alta(creado: Date): NuevoDespliegue {
  return { proyectoId: PROYECTO, disparador: "manual", rama: "main", estado: "encolado", creado };
}

function armar(proyecto: DetalleProyecto | null = DETALLE) {
  const reloj = new RelojFijo(AHORA);
  const despliegues = new RepositorioDesplieguesMemoria();
  const muestras = new MuestrasMetricasMemoria();
  const cuota = new CuotaPlanStub();
  cuota.recursos = { plan: "starter", cpus: 0.5, memoriaMb: 512 };
  const lectura = new LecturaMetricasService(new DetalleFijo(proyecto), cuota, despliegues, muestras, reloj);
  return { reloj, despliegues, muestras, lectura };
}

function respuestaFalsa() {
  const respuesta = {
    estado: 0,
    cuerpo: {} as unknown,
    status(estado: number) {
      this.estado = estado;
      return this;
    },
    json(cuerpo: unknown) {
      this.cuerpo = cuerpo;
    },
  };
  const host = { switchToHttp: () => ({ getResponse: () => respuesta }) } as unknown as ArgumentsHost;
  return { respuesta, host };
}

describe("Lectura de métricas (SP-07)", () => {
  it("Promedio cada 30 min", async () => {
    const { despliegues, muestras, lectura } = armar();
    const activo = await despliegues.crear(alta(AHORA));
    await despliegues.cambiarEstado(activo.id, "saludable", { contenedorId: "c1" });
    await despliegues.marcarActivo(PROYECTO, activo.id);
    muestras.vincular(activo.id, PROYECTO, activo.numero);
    const primerCubo = new Date(ULTIMO_CUBO.getTime() - (PUNTOS_SERIE_24H - 1) * INTERVALO_PROMEDIO_MS);
    for (let cubo = 0; cubo < PUNTOS_SERIE_24H; cubo += 1) {
      const en = new Date(primerCubo.getTime() + cubo * INTERVALO_PROMEDIO_MS + MINUTO_MS);
      await muestras.guardar({ despliegueId: activo.id, tomada: en, cpu: 0.1, memoriaMb: 400 });
      await muestras.guardar({ despliegueId: activo.id, tomada: new Date(en.getTime() + MINUTO_MS), cpu: 0.3, memoriaMb: 434 });
    }

    const respuesta = await lectura.leer(PROYECTO, DUENO, "24h");

    expect(respuesta.limite).toEqual({ cpu: 0.5, memoriaMb: 512 });
    expect(respuesta.serie).toHaveLength(PUNTOS_SERIE_24H);
    expect(respuesta.serie[0]).toEqual({ en: primerCubo, cpu: 0.2, memoriaMb: 417 });
    expect(respuesta.serie.at(-1)?.en).toEqual(ULTIMO_CUBO);
    expect(respuesta.serie.every((punto) => punto.cpu === 0.2 && punto.memoriaMb === 417)).toBe(true);
    expect(respuesta.promedioPorVersion).toEqual([{ version: activo.numero, cpu: 0.2, memoriaMb: 417 }]);
  });

  it("los cubos de 24 h empiezan en :00 o :30 sin importar cuándo se pide", async () => {
    const { despliegues, muestras, lectura } = armar();
    const activo = await despliegues.crear(alta(AHORA));
    await despliegues.cambiarEstado(activo.id, "saludable", { contenedorId: "c1" });
    await despliegues.marcarActivo(PROYECTO, activo.id);
    muestras.vincular(activo.id, PROYECTO, activo.numero);
    for (const tomada of ["2026-10-20T16:47:31.000Z", "2026-10-20T17:03:12.000Z", "2026-10-20T18:07:59.000Z"]) {
      await muestras.guardar({ despliegueId: activo.id, tomada: new Date(tomada), cpu: 0.1, memoriaMb: 100 });
    }

    const respuesta = await lectura.leer(PROYECTO, DUENO, "24h");

    expect(respuesta.serie.map((punto) => punto.en.toISOString())).toEqual([
      "2026-10-20T16:30:00.000Z",
      "2026-10-20T17:00:00.000Z",
      "2026-10-20T18:00:00.000Z",
    ]);
  });

  it("Pico de la ventana", async () => {
    const { despliegues, muestras, lectura } = armar();
    const activo = await despliegues.crear(alta(AHORA));
    await despliegues.cambiarEstado(activo.id, "saludable", { contenedorId: "c1" });
    await despliegues.marcarActivo(PROYECTO, activo.id);
    muestras.vincular(activo.id, PROYECTO, activo.numero);
    const cpuMax = new Date("2026-10-20T03:30:20.000Z");
    const memoriaMax = new Date("2026-10-20T14:00:40.000Z");
    await muestras.guardar({ despliegueId: activo.id, tomada: cpuMax, cpu: 0.27, memoriaMb: 300 });
    await muestras.guardar({ despliegueId: activo.id, tomada: new Date(cpuMax.getTime() + MINUTO_MS), cpu: 0.05, memoriaMb: 310 });
    await muestras.guardar({ despliegueId: activo.id, tomada: memoriaMax, cpu: 0.1, memoriaMb: 452 });
    await muestras.guardar({ despliegueId: activo.id, tomada: new Date(memoriaMax.getTime() + MINUTO_MS), cpu: 0.1, memoriaMb: 400 });

    const respuesta = await lectura.leer(PROYECTO, DUENO, "24h");

    expect(respuesta.pico).toEqual({ cpu: { valor: 0.27, en: cpuMax }, memoriaMb: { valor: 452, en: memoriaMax } });
    expect(Math.max(...respuesta.serie.map((punto) => punto.memoriaMb))).toBeLessThan(452);
  });

  it("la serie de 1 h agrupa por minuto", async () => {
    const { despliegues, muestras, lectura } = armar();
    const activo = await despliegues.crear(alta(AHORA));
    await despliegues.cambiarEstado(activo.id, "saludable", { contenedorId: "c1" });
    await despliegues.marcarActivo(PROYECTO, activo.id);
    muestras.vincular(activo.id, PROYECTO, activo.numero);
    const minuto = new Date("2026-10-20T17:30:10.000Z");
    await muestras.guardar({ despliegueId: activo.id, tomada: minuto, cpu: 0.1, memoriaMb: 100 });
    await muestras.guardar({ despliegueId: activo.id, tomada: new Date(minuto.getTime() + 20_000), cpu: 0.3, memoriaMb: 200 });

    const respuesta = await lectura.leer(PROYECTO, DUENO, "1h");

    expect(respuesta.serie).toEqual([{ en: new Date("2026-10-20T17:30:00.000Z"), cpu: 0.2, memoriaMb: 150 }]);
  });

  it("Despliegues en la ventana", async () => {
    const { despliegues, lectura } = armar();
    const fuera = new Date(AHORA.getTime() - VENTANA_24H_MS - HORA_MS);
    const hace5h = new Date(AHORA.getTime() - 5 * HORA_MS);
    for (let i = 0; i < 13; i += 1) await despliegues.crear(alta(fuera));
    const publicado = await despliegues.crear(alta(hace5h));
    const siguiente = await despliegues.crear(alta(new Date(AHORA.getTime() - HORA_MS)));
    await despliegues.cambiarEstado(publicado.id, "saludable", { contenedorId: "c14" });
    await despliegues.marcarActivo(PROYECTO, publicado.id);

    const respuesta = await lectura.leer(PROYECTO, DUENO, "24h");

    expect(publicado.numero).toBe(14);
    expect(siguiente.numero).toBe(15);
    expect(respuesta.despliegues).toEqual([
      { en: hace5h, version: 14 },
      { en: siguiente.creado, version: 15 },
    ]);
  });

  it("serie vacía si el contenedor no corre", async () => {
    const { despliegues, muestras, lectura } = armar();
    const detenido = await despliegues.crear(alta(AHORA));
    await despliegues.cambiarEstado(detenido.id, "detenido", { contenedorId: "c1" });
    await despliegues.marcarActivo(PROYECTO, detenido.id);
    muestras.vincular(detenido.id, PROYECTO, detenido.numero);
    await muestras.guardar({ despliegueId: detenido.id, tomada: AHORA, cpu: 0.2, memoriaMb: 100 });

    const respuesta = await lectura.leer(PROYECTO, DUENO, "1h");

    expect(respuesta.serie).toEqual([]);
    expect(respuesta.pico).toEqual({ cpu: null, memoriaMb: null });
    expect(respuesta.aviso).toBe(AVISO_CONTENEDOR_NO_CORRE);
  });

  it("sin despliegue activo la serie va vacía con aviso", async () => {
    const { lectura } = armar();

    const respuesta = await lectura.leer(PROYECTO, DUENO, "24h");

    expect(respuesta.serie).toEqual([]);
    expect(respuesta.pico).toEqual({ cpu: null, memoriaMb: null });
    expect(respuesta.aviso).toBe("El contenedor no está corriendo");
  });

  it("un contenedor Saludable sin muestras no trae aviso ni pico", async () => {
    const { despliegues, lectura } = armar();
    const activo = await despliegues.crear(alta(AHORA));
    await despliegues.cambiarEstado(activo.id, "saludable", { contenedorId: "c1" });
    await despliegues.marcarActivo(PROYECTO, activo.id);

    const respuesta = await lectura.leer(PROYECTO, DUENO, "1h");

    expect(respuesta.serie).toEqual([]);
    expect(respuesta.pico).toEqual({ cpu: null, memoriaMb: null });
    expect(respuesta.aviso).toBeNull();
  });

  it("un proyecto ajeno o inexistente es 404", async () => {
    const ajeno = armar({ ...DETALLE, usuarioId: "otro" });
    const filtro = new ErroresMetricasFilter();
    const http = respuestaFalsa();

    await expect(ajeno.lectura.leer(PROYECTO, DUENO, "1h")).rejects.toBeInstanceOf(ProyectoNoEncontrado);
    await expect(armar(null).lectura.leer(PROYECTO, DUENO, "1h")).rejects.toBeInstanceOf(ProyectoNoEncontrado);
    filtro.catch(new ProyectoNoEncontrado(PROYECTO), http.host);

    expect(http.respuesta.estado).toBe(404);
    expect(http.respuesta.cuerpo).toEqual({ codigo: "ProyectoNoEncontrado", mensaje: `No existe el proyecto ${PROYECTO}` });
  });

  it("un rango distinto de 1h o 24h responde 400", () => {
    const filtro = new ErroresMetricasFilter();
    const http = respuestaFalsa();

    expect(() => rangoMetricas("7d")).toThrow(RangoMetricasInvalido);
    expect(() => rangoMetricas(undefined)).toThrow(RangoMetricasInvalido);
    filtro.catch(new RangoMetricasInvalido("7d"), http.host);

    expect(rangoMetricas("1h")).toBe("1h");
    expect(http.respuesta.estado).toBe(400);
    expect(http.respuesta.cuerpo).toEqual({ codigo: "RangoMetricasInvalido", mensaje: "El rango de métricas es 1h o 24h" });
  });

  it("el controlador pide la serie del rango a la lectura", async () => {
    const { lectura } = armar();
    const controlador = new MetricasProyectoController(lectura);

    const respuesta = await controlador.metricas(PROYECTO, "1h", DUENO);

    expect(respuesta.limite).toEqual({ cpu: 0.5, memoriaMb: 512 });
    expect(respuesta.serie).toEqual([]);
  });
});
