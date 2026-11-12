import { RelojFijo } from "../../../compartido/reloj";
import { RepositorioArtefactosMemoria } from "../../../adapters/memoria/repositorio-artefactos.memoria";
import { RepositorioDesplieguesMemoria } from "../../../adapters/memoria/repositorio-despliegues.memoria";
import { ConstructorImagenStub } from "../../../adapters/stubs/constructor-imagen.stub";
import { proyectoDemo } from "../../../pruebas/motor";
import { TIEMPO_MAXIMO_CONSTRUCCION_MS } from "../dominio/motor.constantes";
import { PasoConstruccion } from "./paso-construccion";
import type { ContextoDespliegue } from "./paso-pipeline";

async function contexto(despliegues: RepositorioDesplieguesMemoria): Promise<ContextoDespliegue> {
  const despliegue = await despliegues.crear({ proyectoId: "proyecto-1", disparador: "manual", rama: "main", creado: new Date() } as never);
  return { despliegue, proyecto: proyectoDemo(), bitacora: { escribir: () => undefined }, senal: new AbortController().signal, directorio: "/tmp/x" };
}

describe("PasoConstruccion · tiempo máximo configurable", () => {
  it("Tiempo de construcción configurable: el docker build recibe el tope de la configuración del motor", async () => {
    const constructorImagen = new ConstructorImagenStub();
    const despliegues = new RepositorioDesplieguesMemoria();
    const paso = new PasoConstruccion(constructorImagen, new RepositorioArtefactosMemoria(), despliegues, new RelojFijo(), 30 * 60 * 1000);

    await paso.ejecutar(await contexto(despliegues));

    expect(constructorImagen.solicitudes[0].tiempoMaximoMs).toBe(1_800_000);
  });

  it("sin configuración usa 20 minutos", async () => {
    const constructorImagen = new ConstructorImagenStub();
    const despliegues = new RepositorioDesplieguesMemoria();
    const paso = new PasoConstruccion(constructorImagen, new RepositorioArtefactosMemoria(), despliegues, new RelojFijo());

    await paso.ejecutar(await contexto(despliegues));

    expect(constructorImagen.solicitudes[0].tiempoMaximoMs).toBe(TIEMPO_MAXIMO_CONSTRUCCION_MS);
    expect(TIEMPO_MAXIMO_CONSTRUCCION_MS).toBe(1_200_000);
  });
});
