import { CancelacionesPuerto } from "../../modules/construccion/puertos/cancelaciones.puerto";
import { ColaConstruccionPuerto } from "../../modules/construccion/puertos/cola-construccion.puerto";
import { ColaOperacionPuerto } from "../../modules/orquestacion/puertos/cola-operacion.puerto";
import { ContenedorPuerto } from "../../modules/orquestacion/puertos/contenedor.puerto";
import { MetricasContenedorPuerto } from "../../modules/orquestacion/puertos/metricas-contenedor.puerto";
import { ContenedorDocker } from "../reales/contenedor-docker";
import { MetricasDockerStats } from "../reales/metricas-docker-stats";
import { CancelacionesRedis } from "../reales/cancelaciones-redis";
import { ColaBullMq, ColaOperacionBullMq } from "../reales/cola-bullmq";
import { CancelacionesMemoria } from "./cancelaciones.memoria";
import { ColaMemoria } from "./cola.memoria";
import { ColaOperacionMemoria } from "./cola-operacion.memoria";
import { ContenedorStub } from "./contenedor.stub";
import { MetricasContenedorStub } from "./metricas-contenedor.stub";
import { MetricasNodoPuerto } from "../../modules/administracion/infraestructura/puertos/metricas-nodo.puerto";
import { SalidaContenedorPuerto } from "../../modules/observabilidad/puertos/salida-contenedor.puerto";
import { MetricasNodoSistema } from "../reales/metricas-nodo";
import { SalidaContenedorBullMq } from "../reales/salida-contenedor-bullmq";
import { MetricasNodoStub } from "./metricas-nodo.stub";
import { SalidaContenedorMemoria } from "./salida-contenedor.memoria";

/** LSP: el stub y el adaptador real cumplen el mismo contrato, método por método. */
function metodosDe(clase: abstract new (...args: never[]) => unknown): string[] {
  return Object.getOwnPropertyNames(clase.prototype).filter((m) => m !== "constructor").sort();
}

describe("Stubs del motor (M5-02)", () => {
  it("la cola de operación en memoria entrega en orden", async () => {
    const cola = new ColaOperacionMemoria();

    await cola.encolar({ tipo: "detener", proyectoId: "p", subdominio: "s" });
    await cola.encolar({ tipo: "reiniciar", proyectoId: "p", subdominio: "s" });

    expect(cola.acciones.map((a) => a.tipo)).toEqual(["detener", "reiniciar"]);
  });

  it.each([
    ["ContenedorPuerto", ContenedorStub, ContenedorDocker, ContenedorPuerto],
    ["MetricasContenedorPuerto", MetricasContenedorStub, MetricasDockerStats, MetricasContenedorPuerto],
    ["ColaOperacionPuerto", ColaOperacionMemoria, ColaOperacionBullMq, ColaOperacionPuerto],
    ["CancelacionesPuerto", CancelacionesMemoria, CancelacionesRedis, CancelacionesPuerto],
    ["MetricasNodoPuerto", MetricasNodoStub, MetricasNodoSistema, MetricasNodoPuerto],
  ] as const)("%s: el stub y el real son el mismo puerto y el real implementa cada método del stub", (_n, stub, real, puerto) => {
    expect(stub.prototype).toBeInstanceOf(puerto);
    expect(real.prototype).toBeInstanceOf(puerto);
    expect(metodosDe(stub).length).toBeGreaterThan(0);
    expect(metodosDe(stub).filter((m) => !metodosDe(real).includes(m))).toEqual([]);
  });

  it("ColaConstruccionPuerto: la memoria y BullMQ encolan y quitan (la memoria suma `tomar` solo para las pruebas)", () => {
    for (const cola of [ColaMemoria, ColaBullMq]) {
      expect(cola.prototype).toBeInstanceOf(ColaConstruccionPuerto);
      expect(metodosDe(cola)).toEqual(expect.arrayContaining(["encolar", "quitar"]));
    }
  });

  it("SalidaContenedorPuerto: la memoria y BullMQ leen (la memoria suma `escribir` solo para las pruebas)", () => {
    for (const salida of [SalidaContenedorMemoria, SalidaContenedorBullMq]) {
      expect(salida.prototype).toBeInstanceOf(SalidaContenedorPuerto);
      expect(metodosDe(salida)).toContain("leer");
    }
  });
});
