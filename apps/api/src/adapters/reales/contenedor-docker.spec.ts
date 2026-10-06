import type Docker from "dockerode";
import { ContenedorDocker } from "./contenedor-docker";

/** Doble de dockerode: registra lo que se le pide, sin socket ni Docker. */
function dockerFalso(redesExistentes: string[] = []) {
  const registro = {
    creados: [] as Record<string, unknown>[],
    redesCreadas: [] as string[],
    conectados: [] as string[],
    iniciados: 0,
  };
  const noExiste = Object.assign(new Error("no such container"), { statusCode: 404 });
  const docker = {
    listNetworks: async () => redesExistentes.map((Name) => ({ Name })),
    createNetwork: async (o: { Name: string }) => registro.redesCreadas.push(o.Name),
    getNetwork: () => ({ connect: async (o: { Container: string }) => registro.conectados.push(o.Container) }),
    getContainer: () => ({ remove: async () => { throw noExiste; }, stop: async () => undefined }),
    createContainer: async (o: Record<string, unknown>) => {
      registro.creados.push(o);
      return { id: "c-1", start: async () => { registro.iniciados += 1; } };
    },
  };
  return { docker: docker as unknown as Docker, registro };
}

const espec = {
  nombre: "deploya-hola-deploya-1",
  imagen: "deploya/hola-deploya:1",
  red: "deploya-p-hola-deploya",
  puertoInterno: 8080,
  cpus: 0.25,
  memoriaMb: 256,
  variables: { SALUDO: "hola" },
};

describe("ContenedorDocker", () => {
  it("Arranque con cuota: docker inspect mostraría NanoCpus 250000000 y Memory 268435456", async () => {
    const { docker, registro } = dockerFalso();

    await new ContenedorDocker(docker, ["deploya-traefik", "deploya-worker"]).crear(espec);

    const host = registro.creados[0].HostConfig as Record<string, unknown>;
    expect(host.NanoCpus).toBe(250_000_000);
    expect(host.Memory).toBe(268_435_456);
    expect(host.MemorySwap).toBe(268_435_456);
  });

  it("Sin privilegios y en su red: CapDrop ALL, no-new-privileges y la red del proyecto", async () => {
    const { docker, registro } = dockerFalso();

    const creado = await new ContenedorDocker(docker, ["deploya-traefik", "deploya-worker"]).crear(espec);

    const host = registro.creados[0].HostConfig as Record<string, unknown>;
    expect(host).toEqual(expect.objectContaining({
      Privileged: false, CapDrop: ["ALL"], SecurityOpt: ["no-new-privileges"], NetworkMode: "deploya-p-hola-deploya",
    }));
    expect(registro.redesCreadas).toEqual(["deploya-p-hola-deploya"]);
    expect(registro.conectados).toEqual(["deploya-traefik", "deploya-worker"]);
    expect(registro.iniciados).toBe(1);
    expect(creado).toEqual({ id: "c-1", host: "deploya-hola-deploya-1" });
  });

  it("pasa PORT y las variables al contenedor", async () => {
    const { docker, registro } = dockerFalso();

    await new ContenedorDocker(docker, []).crear(espec);

    expect(registro.creados[0].Env).toEqual(["SALUDO=hola", "PORT=8080"]);
  });

  it("no vuelve a crear la red si ya existe", async () => {
    const { docker, registro } = dockerFalso(["deploya-p-hola-deploya"]);

    await new ContenedorDocker(docker, []).crear(espec);

    expect(registro.redesCreadas).toHaveLength(0);
  });

  it("eliminar un contenedor que ya no existe no falla", async () => {
    const { docker } = dockerFalso();

    await expect(new ContenedorDocker(docker, []).eliminar("c-9")).resolves.toBeUndefined();
  });

  describe("acciones del cliente (M5-02)", () => {
    function dockerConRecursos() {
      const registro = { iniciados: [] as string[], borrados: [] as string[], imagenesBorradas: [] as string[], filtros: [] as unknown[] };
      const conEstado = (statusCode: number) => Object.assign(new Error(`docker ${statusCode}`), { statusCode });
      const docker = {
        getContainer: (id: string) => ({
          start: async () => {
            registro.iniciados.push(id);
            if (id === "ya-corriendo") throw conEstado(304);
          },
          remove: async () => {
            registro.borrados.push(id);
          },
        }),
        listContainers: async (opciones: unknown) => {
          registro.filtros.push(opciones);
          return [{ Id: "c-1" }, { Id: "c-2" }];
        },
        listImages: async (opciones: unknown) => {
          registro.filtros.push(opciones);
          return [{ Id: "sha256:a" }, { Id: "sha256:b" }];
        },
        getImage: (id: string) => ({
          remove: async () => {
            if (id === "sha256:b") throw conEstado(404);
            registro.imagenesBorradas.push(id);
          },
        }),
      };
      return { docker: docker as unknown as Docker, registro };
    }

    it("iniciar arranca el mismo contenedor y no falla si ya corría", async () => {
      const { docker, registro } = dockerConRecursos();
      const adaptador = new ContenedorDocker(docker, []);

      await adaptador.iniciar("c-1");
      await expect(adaptador.iniciar("ya-corriendo")).resolves.toBeUndefined();

      expect(registro.iniciados).toEqual(["c-1", "ya-corriendo"]);
    });

    it("Eliminar borra contenedor, imágenes y ruta: todos los contenedores e imágenes deploya/<subdominio>", async () => {
      const { docker, registro } = dockerConRecursos();
      const adaptador = new ContenedorDocker(docker, []);

      await adaptador.eliminarContenedoresDe("hola-deploya");
      await adaptador.eliminarImagenesDe("hola-deploya");

      expect(registro.filtros).toEqual([
        { all: true, filters: { label: ["app.deploya.proyecto=deploya-p-hola-deploya"] } },
        { filters: { reference: ["deploya/hola-deploya"] } },
      ]);
      expect(registro.borrados).toEqual(["c-1", "c-2"]);
      expect(registro.imagenesBorradas).toEqual(["sha256:a"]);
    });
  });
});
