import type Docker from "dockerode";
import { ContenedorDocker, demultiplexar, lineasDeSalida } from "./contenedor-docker";

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

/** Una trama de `docker logs` sin TTY: flujo, 3 bytes de relleno, largo y el texto. */
function trama(flujo: number, texto: string): Buffer {
  const cuerpo = Buffer.from(texto, "utf8");
  const cabecera = Buffer.alloc(8);
  cabecera[0] = flujo;
  cabecera.writeUInt32BE(cuerpo.length, 4);
  return Buffer.concat([cabecera, cuerpo]);
}

describe("ContenedorDocker.bitacora (SP-12)", () => {
  it("junta stdout y stderr y separa la marca de cada línea", async () => {
    const salida = Buffer.concat([
      trama(1, "2026-10-20T10:41:52.118000000Z INFO GET /health 200\n"),
      trama(2, "2026-10-20T10:42:01.515000000Z ERROR POST /api/pagos 502\r\n"),
    ]);
    const logs = jest.fn(async () => salida);
    const docker = { getContainer: () => ({ logs }) } as unknown as Docker;
    const desde = new Date("2026-10-20T10:41:50.000Z");

    const lineas = await new ContenedorDocker(docker, []).bitacora("c-14", { desde, max: 500 });

    expect(logs).toHaveBeenCalledWith({ follow: false, stdout: true, stderr: true, timestamps: true, tail: 500, since: desde.getTime() / 1000 });
    expect(lineas).toEqual([
      { marca: new Date("2026-10-20T10:41:52.118Z"), texto: "INFO GET /health 200" },
      { marca: new Date("2026-10-20T10:42:01.515Z"), texto: "ERROR POST /api/pagos 502" },
    ]);
  });

  it("sin `desde` no manda `since`", async () => {
    const logs = jest.fn(async () => Buffer.alloc(0));
    const docker = { getContainer: () => ({ logs }) } as unknown as Docker;

    expect(await new ContenedorDocker(docker, []).bitacora("c-14", { desde: null, max: 500 })).toEqual([]);
    expect(logs).toHaveBeenCalledWith(expect.not.objectContaining({ since: expect.anything() }));
  });

  it("con TTY la salida llega cruda y se lee igual", () => {
    expect(demultiplexar(Buffer.from("2026-10-20T10:41:52Z listo\n"))).toBe("2026-10-20T10:41:52Z listo\n");
  });

  it("descarta lo que no trae marca", () => {
    expect(lineasDeSalida("sin marca\n\n2026-10-20T10:41:52Z ok")).toEqual([{ marca: new Date("2026-10-20T10:41:52Z"), texto: "ok" }]);
  });
});
