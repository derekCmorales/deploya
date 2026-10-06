import { ColaOperacionPuerto } from "../../modules/orquestacion/puertos/cola-operacion.puerto";
import { ContenedorPuerto } from "../../modules/orquestacion/puertos/contenedor.puerto";
import { ContenedorDocker } from "../reales/contenedor-docker";
import { ColaOperacionBullMq } from "../reales/cola-bullmq";
import { ColaOperacionMemoria } from "./cola-operacion.memoria";
import { ContenedorStub } from "./contenedor.stub";

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
    ["ColaOperacionPuerto", ColaOperacionMemoria, ColaOperacionBullMq, ColaOperacionPuerto],
  ] as const)("%s: el stub y el real son el mismo puerto y el real implementa cada método del stub", (_n, stub, real, puerto) => {
    expect(stub.prototype).toBeInstanceOf(puerto);
    expect(real.prototype).toBeInstanceOf(puerto);
    expect(metodosDe(stub).length).toBeGreaterThan(0);
    expect(metodosDe(stub).filter((m) => !metodosDe(real).includes(m))).toEqual([]);
  });
});
