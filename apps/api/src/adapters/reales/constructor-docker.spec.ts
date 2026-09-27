import type Docker from "dockerode";
import { PassThrough } from "node:stream";
import { ConstruccionFallida } from "../../modules/construccion/dominio/errores";
import { ConstructorDocker } from "./constructor-docker";

type Evento = { stream?: string; error?: string; errorDetail?: { code?: number } };

const empaquetarFalso = () => new PassThrough();

/** Doble de dockerode cuyo `followProgress` reproduce los eventos de un build. */
function dockerQueEmite(eventos: Evento[]) {
  return {
    buildImage: async () => new PassThrough(),
    getImage: () => ({ inspect: async () => ({ Id: "sha256:abc", Size: 48_000_000 }) }),
    modem: {
      followProgress: (_f: unknown, alTerminar: (e: Error | null) => void, alEvento: (e: Evento) => void) => {
        eventos.forEach(alEvento);
        alTerminar(null);
      },
    },
  } as unknown as Docker;
}

const solicitud = { directorio: "/tmp/x", rutaDockerfile: "Dockerfile", etiqueta: "deploya/p:1", tiempoMaximoMs: 1000 };

describe("ConstructorDocker", () => {
  it("manda cada línea del build a la bitácora y devuelve digest y tamaño", async () => {
    const lineas: string[] = [];

    const imagen = await new ConstructorDocker(dockerQueEmite([{ stream: "Step 1/2 : FROM node\n" }, { stream: "ok\n" }]), empaquetarFalso).construir(
      solicitud,
      (l) => lineas.push(l),
    );

    expect(lineas).toEqual(["Step 1/2 : FROM node", "ok"]);
    expect(imagen).toEqual({ digest: "sha256:abc", tamanoBytes: 48_000_000 });
  });

  it("un RUN que termina con código 127 lanza ConstruccionFallida con ese código", async () => {
    const docker = dockerQueEmite([
      { stream: "> tsc -p tsconfig.json\n" },
      { error: "The command '/bin/sh -c npm run build' returned a non-zero code: 127", errorDetail: { code: 127 } },
    ]);

    const promesa = new ConstructorDocker(docker, empaquetarFalso).construir(solicitud, () => undefined);

    await expect(promesa).rejects.toThrow(ConstruccionFallida);
    await expect(promesa).rejects.toMatchObject({ codigoSalida: 127 });
  });

  it("si no se puede leer el clon, falla como construcción y no tumba el proceso", async () => {
    const contexto = new PassThrough();
    const docker = {
      buildImage: async () => {
        contexto.emit("error", new Error("ENOENT /tmp/x"));
        throw new Error("aborted");
      },
    } as unknown as Docker;

    const promesa = new ConstructorDocker(docker, () => contexto).construir(solicitud, () => undefined);

    await expect(promesa).rejects.toThrow("no se pudo leer el código: ENOENT /tmp/x");
  });
});
