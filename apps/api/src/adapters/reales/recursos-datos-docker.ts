import type Docker from "dockerode";
import type { ComandoPreparacion } from "../../modules/datos/dominio/tipo-recurso-datos";
import { RecursosDatosPuerto, type EspecRecursoDatos } from "../../modules/datos/puertos/recursos-datos.puerto";
import { demultiplexar } from "./contenedor-docker";
import { asegurarRed, ESTADO_CONFLICTO, ESTADO_NO_EXISTE, ESTADO_PROHIBIDO, ESTADO_YA_HECHO, ignorarEstados } from "./redes-docker";

/** Etiqueta de contenedores y volúmenes de datos: el subdominio del proyecto dueño. */
export const ETIQUETA_DATOS = "app.deploya.datos";
/**
 * Lo mínimo para que el entrypoint de Postgres (y el de Redis) haga `chown` del volumen y baje a su
 * usuario con `gosu`/`su-exec`: imágenes fijas de Deploya, nunca código del usuario (recursos-datos.md).
 */
export const CAPACIDADES_DATOS = ["CHOWN", "SETUID", "SETGID", "FOWNER", "DAC_OVERRIDE"] as const;

const BYTES_POR_MB = 1024 * 1024;
const SEGUNDOS_PARA_DETENER = 10;
const MB_DE_DU = /^(\d+)\s/;
const LARGO_MAXIMO_DETALLE = 300;
const INTENTOS_CODIGO_SALIDA = 20;
const ESPERA_CODIGO_SALIDA_MS = 50;

export class PreparacionFallida extends Error {
  constructor(comando: readonly string[], segundos: number, salida: string) {
    super(`«${comando.slice(0, 2).join(" ")}» no respondió en ${segundos} s${salida ? `: ${salida.slice(-LARGO_MAXIMO_DETALLE).trim()}` : ""}`);
    this.name = "PreparacionFallida";
  }
}

export interface OpcionesPreparacion {
  /** Cuánto se espera cada comando de preparación (la primera vez Postgres corre `initdb`). */
  tiempoMaximoMs: number;
  intervaloMs: number;
  esperar: (ms: number) => Promise<void>;
}

export const PREPARACION_POR_OMISION: OpcionesPreparacion = {
  tiempoMaximoMs: 180_000,
  intervaloMs: 1000,
  esperar: (ms) => new Promise((resolver) => setTimeout(resolver, ms)),
};

interface SalidaExec {
  codigo: number | null;
  salida: string;
}

/**
 * Adapter dockerode de `RecursosDatosPuerto`: volumen con nombre, sin puertos publicados en el host,
 * `CapDrop ALL` con las capacidades mínimas de arranque, `no-new-privileges`, límite de memoria y
 * `unless-stopped`. Vive en la red del dueño y en las de los proyectos con los que se comparte.
 */
export class RecursosDatosDocker extends RecursosDatosPuerto {
  constructor(
    private readonly docker: Docker,
    private readonly serviciosConectados: string[],
    private readonly opciones: OpcionesPreparacion = PREPARACION_POR_OMISION,
  ) {
    super();
  }

  async crear(espec: EspecRecursoDatos): Promise<void> {
    await asegurarRed(this.docker, espec.red, this.serviciosConectados);
    await ignorarEstados([ESTADO_NO_EXISTE], () => this.docker.getContainer(espec.nombre).remove({ force: true }));
    await this.docker.createVolume({ Name: espec.volumen, Labels: { [ETIQUETA_DATOS]: espec.subdominioDueno } });
    const contenedor = await this.docker.createContainer(configuracionContenedor(espec));
    for (const red of espec.redesCompartidas) await this.conectar(espec.nombre, red);
    await contenedor.start();
  }

  async preparar(contenedor: string, comandos: readonly ComandoPreparacion[]): Promise<void> {
    for (const comando of comandos) await this.hastaQueSalgaBien(contenedor, comando);
  }

  async conectar(contenedor: string, red: string): Promise<void> {
    await asegurarRed(this.docker, red, this.serviciosConectados);
    await ignorarEstados([ESTADO_PROHIBIDO, ESTADO_CONFLICTO], () => this.docker.getNetwork(red).connect({ Container: contenedor }));
  }

  async desconectar(contenedor: string, red: string): Promise<void> {
    await ignorarEstados([ESTADO_PROHIBIDO, ESTADO_NO_EXISTE, ESTADO_CONFLICTO], () =>
      this.docker.getNetwork(red).disconnect({ Container: contenedor, Force: true }),
    );
  }

  async iniciar(contenedor: string): Promise<void> {
    await ignorarEstados([ESTADO_YA_HECHO], () => this.docker.getContainer(contenedor).start());
  }

  async detener(contenedor: string): Promise<void> {
    await ignorarEstados([ESTADO_YA_HECHO, ESTADO_NO_EXISTE], () => this.docker.getContainer(contenedor).stop({ t: SEGUNDOS_PARA_DETENER }));
  }

  async eliminar(contenedor: string, volumen: string): Promise<void> {
    await ignorarEstados([ESTADO_NO_EXISTE], () => this.docker.getContainer(contenedor).remove({ force: true }));
    await ignorarEstados([ESTADO_NO_EXISTE], () => this.docker.getVolume(volumen).remove());
  }

  async liberarProyecto(subdominio: string, red: string): Promise<void> {
    const propios = await this.docker.listContainers({ all: true, filters: { label: [`${ETIQUETA_DATOS}=${subdominio}`] } });
    for (const { Id } of propios) await ignorarEstados([ESTADO_NO_EXISTE], () => this.docker.getContainer(Id).remove({ force: true }));
    const { Volumes: volumenes } = await this.docker.listVolumes({ filters: { label: [`${ETIQUETA_DATOS}=${subdominio}`] } });
    for (const { Name } of volumenes ?? []) await ignorarEstados([ESTADO_NO_EXISTE], () => this.docker.getVolume(Name).remove());
    const ajenos = await this.docker.listContainers({ all: true, filters: { label: [ETIQUETA_DATOS], network: [red] } });
    for (const { Id } of ajenos) await this.desconectar(Id, red);
  }

  async medirUsoMb(contenedor: string, ruta: string): Promise<number | null> {
    try {
      const { codigo, salida } = await this.ejecutar(contenedor, ["du", "-sm", ruta]);
      const coincidencia = MB_DE_DU.exec(salida);
      return codigo === 0 && coincidencia ? Number(coincidencia[1]) : null;
    } catch {
      return null;
    }
  }

  private async hastaQueSalgaBien(contenedor: string, comando: ComandoPreparacion): Promise<void> {
    const { tiempoMaximoMs, intervaloMs, esperar } = this.opciones;
    let ultima = "";
    for (let esperado = 0; esperado <= tiempoMaximoMs; esperado += intervaloMs) {
      const resultado = await this.ejecutar(contenedor, comando).catch((error: Error): SalidaExec => ({ codigo: null, salida: error.message }));
      if (resultado.codigo === 0) return;
      ultima = resultado.salida;
      await esperar(intervaloMs);
    }
    throw new PreparacionFallida(comando, Math.round(tiempoMaximoMs / 1000), ultima);
  }

  /** `docker exec` sin shell ni TTY; devuelve el código de salida y stdout+stderr. */
  private async ejecutar(contenedor: string, comando: ComandoPreparacion): Promise<SalidaExec> {
    const exec = await this.docker.getContainer(contenedor).exec({ Cmd: [...comando], AttachStdout: true, AttachStderr: true });
    const flujo = await exec.start({ hijack: true, stdin: false });
    const salida = await leerHastaElFinal(flujo);
    let estado = await exec.inspect();
    // El flujo puede cerrar un instante antes de que Docker registre el código de salida.
    for (let intento = 0; estado.Running && intento < INTENTOS_CODIGO_SALIDA; intento += 1) {
      await this.opciones.esperar(ESPERA_CODIGO_SALIDA_MS);
      estado = await exec.inspect();
    }
    return { codigo: estado.ExitCode ?? null, salida: demultiplexar(salida) };
  }
}

function leerHastaElFinal(flujo: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolver, rechazar) => {
    const partes: Buffer[] = [];
    flujo.on("data", (parte: Buffer) => partes.push(parte));
    flujo.on("end", () => resolver(Buffer.concat(partes)));
    flujo.on("error", rechazar);
  });
}

/** La configuración de `docker create` de un recurso de datos (exportada para probarla sin Docker). */
export function configuracionContenedor(espec: EspecRecursoDatos): Docker.ContainerCreateOptions {
  const memoria = espec.memoriaMb * BYTES_POR_MB;
  return {
    name: espec.nombre,
    Image: espec.imagen,
    Env: Object.entries(espec.entorno).map(([clave, valor]) => `${clave}=${valor}`),
    ...(espec.comando ? { Cmd: espec.comando } : {}),
    Labels: { [ETIQUETA_DATOS]: espec.subdominioDueno },
    HostConfig: {
      Memory: memoria,
      MemorySwap: memoria,
      Privileged: false,
      CapDrop: ["ALL"],
      CapAdd: [...CAPACIDADES_DATOS],
      SecurityOpt: ["no-new-privileges"],
      NetworkMode: espec.red,
      RestartPolicy: { Name: "unless-stopped" },
      Mounts: [{ Type: "volume", Source: espec.volumen, Target: espec.rutaDatos }],
    },
  };
}
