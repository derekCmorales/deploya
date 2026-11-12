import { PassThrough } from "node:stream";
import type Docker from "dockerode";
import type { EspecRecursoDatos } from "../../modules/datos/puertos/recursos-datos.puerto";
import { CAPACIDADES_DATOS, configuracionContenedor, ETIQUETA_DATOS, PreparacionFallida, RecursosDatosDocker } from "./recursos-datos-docker";

const ESPEC: EspecRecursoDatos = {
  nombre: "deploya-datos-nimbo-postgres",
  imagen: "pgvector/pgvector:pg17",
  volumen: "deploya-datos-nimbo-postgres",
  rutaDatos: "/var/lib/postgresql/data",
  red: "deploya-p-nimbo",
  redesCompartidas: ["deploya-p-nimbo-worker"],
  memoriaMb: 512,
  entorno: { POSTGRES_USER: "deploya" },
  comando: null,
  subdominioDueno: "nimbo",
};

const SIN_ESPERA = { tiempoMaximoMs: 3, intervaloMs: 1, esperar: async () => undefined };
const noExiste = () => Object.assign(new Error("no such"), { statusCode: 404 });

/** Trama de `docker exec` sin TTY: stdout (1), relleno y largo. */
function trama(texto: string): Buffer {
  const cuerpo = Buffer.from(texto);
  const cabecera = Buffer.alloc(8);
  cabecera[0] = 1;
  cabecera.writeUInt32BE(cuerpo.length, 4);
  return Buffer.concat([cabecera, cuerpo]);
}

/** Doble de dockerode: registra lo pedido; `salidas` decide qué devuelve cada `exec`. */
function dockerFalso(salidas: { codigo: number; texto: string }[] = []) {
  const registro = {
    creados: [] as Docker.ContainerCreateOptions[],
    volumenesCreados: [] as string[],
    conexiones: [] as [string, string][],
    desconexiones: [] as [string, string][],
    eliminados: [] as string[],
    volumenesBorrados: [] as string[],
    execs: [] as string[][],
    iniciados: 0,
  };
  const contenedor = (id: string) => ({
    remove: async () => {
      if (id === ESPEC.nombre && registro.creados.length === 0) throw noExiste();
      registro.eliminados.push(id);
    },
    start: async () => {
      registro.iniciados += 1;
    },
    stop: async () => {
      throw Object.assign(new Error("ya detenido"), { statusCode: 304 });
    },
    exec: async ({ Cmd }: { Cmd: string[] }) => {
      registro.execs.push(Cmd);
      const salida = salidas.shift() ?? { codigo: 0, texto: "" };
      return {
        start: async () => {
          const flujo = new PassThrough();
          setImmediate(() => flujo.end(trama(salida.texto)));
          return flujo;
        },
        inspect: async () => ({ ExitCode: salida.codigo, Running: false }),
      };
    },
  });
  const docker = {
    listNetworks: async () => [],
    createNetwork: async () => undefined,
    getNetwork: (red: string) => ({
      connect: async ({ Container }: { Container: string }) => registro.conexiones.push([Container, red]),
      disconnect: async ({ Container }: { Container: string }) => registro.desconexiones.push([Container, red]),
    }),
    getContainer: contenedor,
    createVolume: async ({ Name }: { Name: string }) => registro.volumenesCreados.push(Name),
    getVolume: (nombre: string) => ({ remove: async () => registro.volumenesBorrados.push(nombre) }),
    createContainer: async (opciones: Docker.ContainerCreateOptions) => {
      registro.creados.push(opciones);
      return contenedor(opciones.name ?? "");
    },
    listContainers: async ({ filters }: { filters: { label: string[]; network?: string[] } }) =>
      filters.network ? [{ Id: "ajeno-redis" }] : [{ Id: "propio-postgres" }],
    listVolumes: async () => ({ Volumes: [{ Name: "deploya-datos-nimbo-postgres" }] }),
  };
  return { docker: docker as unknown as Docker, registro };
}

describe("RecursosDatosDocker", () => {
  it("Sin puertos publicados y capacidades mínimas: CapDrop ALL + CHOWN, SETUID, SETGID, FOWNER, DAC_OVERRIDE", () => {
    const opciones = configuracionContenedor(ESPEC);

    expect(opciones.HostConfig).toEqual(
      expect.objectContaining({
        Privileged: false,
        CapDrop: ["ALL"],
        CapAdd: ["CHOWN", "SETUID", "SETGID", "FOWNER", "DAC_OVERRIDE"],
        SecurityOpt: ["no-new-privileges"],
        Memory: 536_870_912,
        MemorySwap: 536_870_912,
        NetworkMode: "deploya-p-nimbo",
        RestartPolicy: { Name: "unless-stopped" },
        Mounts: [{ Type: "volume", Source: "deploya-datos-nimbo-postgres", Target: "/var/lib/postgresql/data" }],
      }),
    );
    expect(opciones.HostConfig).not.toHaveProperty("PortBindings");
    expect(opciones).not.toHaveProperty("ExposedPorts");
    expect(opciones.Labels).toEqual({ [ETIQUETA_DATOS]: "nimbo" });
    expect(CAPACIDADES_DATOS).toHaveLength(5);
  });

  it("con comando lo manda como Cmd (Redis con AOF); sin él, el de la imagen", () => {
    expect(configuracionContenedor({ ...ESPEC, comando: ["redis-server", "--appendonly", "yes"] }).Cmd).toEqual(["redis-server", "--appendonly", "yes"]);
    expect(configuracionContenedor(ESPEC)).not.toHaveProperty("Cmd");
  });

  it("crear: volumen con nombre, contenedor en la red del dueño, conectado a las compartidas y arrancado", async () => {
    const { docker, registro } = dockerFalso();

    await new RecursosDatosDocker(docker, ["deploya-traefik"], SIN_ESPERA).crear(ESPEC);

    expect(registro.volumenesCreados).toEqual(["deploya-datos-nimbo-postgres"]);
    expect(registro.creados).toHaveLength(1);
    expect(registro.conexiones).toEqual([
      ["deploya-traefik", "deploya-p-nimbo"],
      ["deploya-traefik", "deploya-p-nimbo-worker"],
      ["deploya-datos-nimbo-postgres", "deploya-p-nimbo-worker"],
    ]);
    expect(registro.iniciados).toBe(1);
  });

  it("preparar repite cada comando hasta que sale con 0", async () => {
    const { docker, registro } = dockerFalso([{ codigo: 2, texto: "no response" }, { codigo: 0, texto: "" }, { codigo: 0, texto: "" }]);
    const recursos = new RecursosDatosDocker(docker, [], { ...SIN_ESPERA, tiempoMaximoMs: 10 });

    await recursos.preparar("c", [["pg_isready"], ["psql", "-c", "CREATE EXTENSION vector"]]);

    expect(registro.execs).toEqual([["pg_isready"], ["pg_isready"], ["psql", "-c", "CREATE EXTENSION vector"]]);
  });

  it("Imagen que no arranca: si el comando nunca sale con 0 lanza PreparacionFallida con la última salida", async () => {
    const { docker } = dockerFalso(Array.from({ length: 10 }, () => ({ codigo: 1, texto: "connection refused" })));

    await expect(new RecursosDatosDocker(docker, [], SIN_ESPERA).preparar("c", [["pg_isready", "-h"]])).rejects.toThrow(
      new PreparacionFallida(["pg_isready", "-h"], 0, "connection refused"),
    );
  });

  it("medirUsoMb lee los MB de du -sm; si falla devuelve null", async () => {
    const { docker, registro } = dockerFalso([{ codigo: 0, texto: "37\t/data\n" }, { codigo: 1, texto: "du: no such file" }]);
    const recursos = new RecursosDatosDocker(docker, [], SIN_ESPERA);

    expect(await recursos.medirUsoMb("c", "/data")).toBe(37);
    expect(await recursos.medirUsoMb("c", "/data")).toBeNull();
    expect(registro.execs[0]).toEqual(["du", "-sm", "/data"]);
  });

  it("eliminar borra contenedor y volumen", async () => {
    const { docker, registro } = dockerFalso();
    await new RecursosDatosDocker(docker, [], SIN_ESPERA).crear(ESPEC);

    await new RecursosDatosDocker(docker, [], SIN_ESPERA).eliminar("deploya-datos-nimbo-postgres", "deploya-datos-nimbo-postgres");

    expect(registro.eliminados).toContain("deploya-datos-nimbo-postgres");
    expect(registro.volumenesBorrados).toEqual(["deploya-datos-nimbo-postgres"]);
  });

  it("liberarProyecto borra los propios con su volumen y desconecta de la red los ajenos", async () => {
    const { docker, registro } = dockerFalso();

    await new RecursosDatosDocker(docker, [], SIN_ESPERA).liberarProyecto("nimbo", "deploya-p-nimbo");

    expect(registro.eliminados).toEqual(["propio-postgres"]);
    expect(registro.volumenesBorrados).toEqual(["deploya-datos-nimbo-postgres"]);
    expect(registro.desconexiones).toEqual([["ajeno-redis", "deploya-p-nimbo"]]);
  });

  it("detener un contenedor ya detenido no falla (idempotente)", async () => {
    const { docker } = dockerFalso();

    await expect(new RecursosDatosDocker(docker, [], SIN_ESPERA).detener("c")).resolves.toBeUndefined();
  });
});
