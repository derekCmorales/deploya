import { EsperaTemporizador } from "../../compartido/espera";
import { existsSync } from "node:fs";
import Docker from "dockerode";
import { RelojFijo } from "../../compartido/reloj";
import { GeneradorSecretosCrypto } from "../../modules/datos/adaptadores/generador-secretos.crypto";
import { ConexionesDatos } from "../../modules/datos/conexiones-datos";
import { DatosService } from "../../modules/datos/datos.service";
import { nombreRecursoDatos, type TipoRecurso } from "../../modules/datos/dominio/recurso-datos";
import { MotorDatosService } from "../../modules/datos/motor-datos.service";
import { EnrutamientoService } from "../../modules/enrutamiento/enrutamiento.service";
import { CifradorFalso } from "../../modules/proyectos/adaptadores/cifrador-falso";
import { CuotaDatosFija, proyectoDatos } from "../../pruebas/datos";
import { ProyectosLecturaMemoria } from "../memoria/proyectos-lectura.memoria";
import { RepositorioRecursosDatosMemoria } from "../memoria/repositorio-recursos-datos.memoria";
import { ColaDatosMemoria } from "../stubs/cola-datos.memoria";
import { EnrutamientoStub } from "../stubs/enrutamiento.stub";
import { demultiplexar } from "./contenedor-docker";
import { RecursosDatosDocker } from "./recursos-datos-docker";

/**
 * Integración REAL con Docker (no corre en `pnpm test`): `DEPLOYA_PRUEBAS_DOCKER=1 pnpm --filter
 * @deploya/api exec jest recursos-datos-docker.int` con dockerd y las imágenes `pgvector/pgvector:pg17`,
 * `redis:7-alpine` y `pgsty/silo`. Recorre la API y el trabajador con el adaptador dockerode real.
 */
const SOCKET = "/var/run/docker.sock";
const conDocker = process.env.DEPLOYA_PRUEBAS_DOCKER === "1" && existsSync(SOCKET) ? describe : describe.skip;
const USUARIO = "usuario-1";
const SUFIJO = Date.now().toString(36);
const API = `it-api-${SUFIJO}`;
const WORKER = `it-worker-${SUFIJO}`;
const MINUTOS = 60_000;

jest.setTimeout(10 * MINUTOS);

conDocker("RecursosDatosDocker con Docker real", () => {
  const docker = new Docker({ socketPath: SOCKET });
  const proyectos = new ProyectosLecturaMemoria();
  const repositorio = new RepositorioRecursosDatosMemoria(new RelojFijo());
  const cola = new ColaDatosMemoria();
  const cifrador = new CifradorFalso();
  const conexiones = new ConexionesDatos(cifrador, { esquema: "http", dominioBase: "localhost" });
  const servicio = new DatosService(proyectos, repositorio, cola, new CuotaDatosFija(), new GeneradorSecretosCrypto(), cifrador, conexiones);
  const recursos = new RecursosDatosDocker(docker, []);
  const rutas = new EnrutamientoStub();
  const motor = new MotorDatosService(repositorio, proyectos, recursos, conexiones, new EnrutamientoService(rutas), new RelojFijo(), new EsperaTemporizador());
  let procesados = 0;
  const ids: Partial<Record<TipoRecurso, string>> = {};

  async function procesar(): Promise<void> {
    for (const comando of cola.comandos.slice(procesados)) await motor.ejecutar(comando);
    procesados = cola.comandos.length;
  }

  /** Un contenedor de «app» efímero en la red del proyecto: corre el comando y devuelve su salida. */
  async function efimero(imagen: string, red: string, cmd: string[], entrypoint?: string[]): Promise<{ codigo: number; salida: string }> {
    const contenedor = await docker.createContainer({
      Image: imagen,
      Cmd: cmd,
      ...(entrypoint ? { Entrypoint: entrypoint } : {}),
      HostConfig: { NetworkMode: red, CapDrop: ["ALL"], SecurityOpt: ["no-new-privileges"] },
      Labels: { "app.deploya.prueba": SUFIJO },
    });
    await contenedor.start();
    const { StatusCode } = (await contenedor.wait()) as { StatusCode: number };
    const salida = demultiplexar((await contenedor.logs({ stdout: true, stderr: true, follow: false })) as unknown as Buffer);
    await contenedor.remove({ force: true });
    return { codigo: StatusCode, salida };
  }

  async function variablesDe(proyectoId: string, tipo: TipoRecurso): Promise<Record<string, string>> {
    return (await servicio.conexion(USUARIO, proyectoId, ids[tipo]!)).variables;
  }

  async function existeVolumen(nombre: string): Promise<boolean> {
    return docker.getVolume(nombre).inspect().then(() => true, () => false);
  }

  beforeAll(() => {
    proyectos.agregar(proyectoDatos(API, { nombre: "api", subdominio: API }));
    proyectos.agregar(proyectoDatos(WORKER, { nombre: "worker", subdominio: WORKER }));
  });

  afterAll(async () => {
    await motor.liberarProyecto(API).catch(() => undefined);
    await motor.liberarProyecto(WORKER).catch(() => undefined);
    const efimeros = await docker.listContainers({ all: true, filters: { label: [`app.deploya.prueba=${SUFIJO}`] } });
    for (const { Id } of efimeros) await docker.getContainer(Id).remove({ force: true });
    for (const red of [`deploya-p-${API}`, `deploya-p-${WORKER}`]) await docker.getNetwork(red).remove().catch(() => undefined);
  });

  it("crea postgres con CapDrop ALL + 5 capacidades, sin puertos publicados, y queda disponible con pgvector", async () => {
    ids.postgres = (await servicio.crear(USUARIO, API, "postgres")).id;
    await procesar();

    expect(await repositorio.porId(ids.postgres)).toMatchObject({ estado: "disponible", detalle: null });
    const inspeccion = await docker.getContainer(nombreRecursoDatos(API, "postgres")).inspect();
    expect(inspeccion.HostConfig.CapDrop).toEqual(["ALL"]);
    const capacidades = ((inspeccion.HostConfig.CapAdd ?? []) as string[]).map((c: string) => c.replace(/^CAP_/, "")).sort();
    expect(capacidades).toEqual(["CHOWN", "DAC_OVERRIDE", "FOWNER", "SETGID", "SETUID"]);
    expect(inspeccion.HostConfig.SecurityOpt).toEqual(["no-new-privileges"]);
    expect(inspeccion.HostConfig.PortBindings ?? {}).toEqual({});
    expect(inspeccion.State.Running).toBe(true);
  });

  it("una app en la misma red se conecta con DATABASE_URL, hace CREATE EXTENSION vector y escribe", async () => {
    const { DATABASE_URL } = await variablesDe(API, "postgres");
    const sql = "CREATE EXTENSION IF NOT EXISTS vector; CREATE TABLE notas (id int, v vector(3)); INSERT INTO notas VALUES (1, '[1,2,3]'); SELECT extversion FROM pg_extension WHERE extname = 'vector';";

    const { codigo, salida } = await efimero("pgvector/pgvector:pg17", `deploya-p-${API}`, ["psql", DATABASE_URL, "-v", "ON_ERROR_STOP=1", "-tAc", sql]);

    expect(codigo).toBe(0);
    expect(salida).toMatch(/\d+\.\d+/);
  });

  it("los datos persisten al recrear la app, al detener y reanudar, y al recrear el contenedor de datos", async () => {
    const { DATABASE_URL } = await variablesDe(API, "postgres");
    await servicio.detenerTodosDe(USUARIO);
    await procesar();
    expect((await docker.getContainer(nombreRecursoDatos(API, "postgres")).inspect()).State.Running).toBe(false);
    await servicio.reanudarTodosDe(USUARIO);
    await procesar();
    const recurso = (await repositorio.porId(ids.postgres!))!;
    await repositorio.cambiarEstado(recurso.id, "creando");
    await motor.ejecutar({ accion: "crear", recursoId: recurso.id });

    const { codigo, salida } = await efimero("pgvector/pgvector:pg17", `deploya-p-${API}`, ["psql", DATABASE_URL, "-tAc", "SELECT v FROM notas WHERE id = 1"]);

    expect(codigo).toBe(0);
    expect(salida.trim()).toBe("[1,2,3]");
  });

  it("redis responde PONG con REDIS_URL y, compartido con otro proyecto, también desde su red", async () => {
    ids.redis = (await servicio.crear(USUARIO, API, "redis")).id;
    await procesar();
    await servicio.compartir(USUARIO, API, ids.redis, WORKER);
    await procesar();
    const { REDIS_URL } = await variablesDe(WORKER, "redis");

    const propio = await efimero("redis:7-alpine", `deploya-p-${API}`, ["redis-cli", "-u", REDIS_URL, "--no-auth-warning", "ping"]);
    const compartido = await efimero("redis:7-alpine", `deploya-p-${WORKER}`, ["redis-cli", "-u", REDIS_URL, "--no-auth-warning", "ping"]);

    expect(await repositorio.porId(ids.redis)).toMatchObject({ estado: "disponible" });
    expect(propio.salida.trim()).toBe("PONG");
    expect(compartido.salida.trim()).toBe("PONG");
  });

  it("s3 queda con el bucket app versionado y la ruta pública <subdominio>-s3 publicada", async () => {
    ids.s3 = (await servicio.crear(USUARIO, API, "s3")).id;
    await procesar();
    const v = await variablesDe(API, "s3");
    const guion = `mc alias set x ${v.S3_ENDPOINT} ${v.S3_ACCESS_KEY} ${v.S3_SECRET_KEY} >/dev/null && mc version info x/${v.S3_BUCKET}`;

    const { codigo, salida } = await efimero("pgsty/silo", `deploya-p-${API}`, [guion], ["sh", "-c"]);

    expect(await repositorio.porId(ids.s3)).toMatchObject({ estado: "disponible" });
    expect(codigo).toBe(0);
    expect(salida).toContain("versioning is enabled");
    expect(rutas.publicadas).toEqual([{ subdominio: `${API}-s3`, host: nombreRecursoDatos(API, "s3"), puerto: 9000 }]);
    expect(v.S3_PUBLIC_ENDPOINT).toBe(`http://${API}-s3.localhost`);
  });

  it("mide el disco de cada recurso disponible", async () => {
    expect(await motor.medirDiscos()).toBe(3);
    expect((await repositorio.porId(ids.postgres!))?.usoDiscoMb).toBeGreaterThan(10);
  });

  it("eliminar desde el dueño borra contenedor y volumen", async () => {
    for (const tipo of ["postgres", "redis", "s3"] as const) await servicio.eliminar(USUARIO, API, ids[tipo]!, tipo);
    await procesar();

    for (const tipo of ["postgres", "redis", "s3"] as const) {
      const nombre = nombreRecursoDatos(API, tipo);
      expect(await existeVolumen(nombre)).toBe(false);
      await expect(docker.getContainer(nombre).inspect()).rejects.toMatchObject({ statusCode: 404 });
    }
    expect(rutas.retiradas).toEqual([`${API}-s3`]);
  });
});
