import type Docker from "dockerode";
import {
  ContenedorPuerto,
  type ConsultaSalida,
  type ContenedorCreado,
  type EspecContenedor,
  type LineaSalida,
} from "../../modules/orquestacion/puertos/contenedor.puerto";
import { PREFIJO_IMAGEN, redDeProyecto } from "../../modules/construccion/dominio/motor.constantes";
import { limitesDesde } from "../../modules/orquestacion/dominio/limites-contenedor";

const SEGUNDOS_PARA_DETENER = 10;
const ESTADO_YA_HECHO = 304;
const ESTADO_NO_EXISTE = 404;
const ESTADO_PROHIBIDO = 403;
const ESTADO_CONFLICTO = 409;
const ETIQUETA_DEPLOYA = "app.deploya.proyecto";
/** Cabecera de cada trama de `docker logs` sin TTY: flujo (1 byte), 3 de relleno y el largo (4 bytes). */
const CABECERA_TRAMA = 8;
const POSICION_LARGO = 4;
const FLUJOS_DOCKER = new Set([0, 1, 2]);
const MS_POR_SEGUNDO = 1000;

/** Junta las tramas de stdout y stderr; si el contenedor tiene TTY la salida ya viene cruda. */
export function demultiplexar(salida: Buffer): string {
  if (salida.length < CABECERA_TRAMA || !FLUJOS_DOCKER.has(salida[0])) return salida.toString("utf8");
  const partes: Buffer[] = [];
  let posicion = 0;
  while (posicion + CABECERA_TRAMA <= salida.length) {
    const largo = salida.readUInt32BE(posicion + POSICION_LARGO);
    partes.push(salida.subarray(posicion + CABECERA_TRAMA, posicion + CABECERA_TRAMA + largo));
    posicion += CABECERA_TRAMA + largo;
  }
  return Buffer.concat(partes).toString("utf8");
}

/** `--timestamps` antepone la marca RFC 3339 con nanosegundos y un espacio; se descarta lo que no la trae. */
export function lineasDeSalida(texto: string): LineaSalida[] {
  return texto.split("\n").flatMap((linea) => {
    const espacio = linea.indexOf(" ");
    const marca = new Date(linea.slice(0, espacio));
    if (espacio < 0 || Number.isNaN(marca.getTime())) return [];
    return [{ marca, texto: linea.slice(espacio + 1).replace(/\r$/, "") }];
  });
}

/**
 * Contenedor sin privilegios, con los límites del plan y en la red propia del
 * proyecto, a la que solo se conectan Traefik y el trabajador (ADR 0005).
 */
export class ContenedorDocker extends ContenedorPuerto {
  constructor(
    private readonly docker: Docker,
    private readonly serviciosConectados: string[],
  ) {
    super();
  }

  async crear(espec: EspecContenedor): Promise<ContenedorCreado> {
    await this.asegurarRed(espec.red);
    const limites = limitesDesde(espec);
    await this.eliminarSiExiste(espec.nombre);
    const contenedor = await this.docker.createContainer({
      name: espec.nombre,
      Image: espec.imagen,
      Env: Object.entries({ ...espec.variables, PORT: String(espec.puertoInterno) }).map(([k, v]) => `${k}=${v}`),
      Labels: { [ETIQUETA_DEPLOYA]: espec.red },
      HostConfig: {
        NanoCpus: limites.nanoCpus,
        Memory: limites.memoriaBytes,
        MemorySwap: limites.memoriaBytes,
        Privileged: false,
        CapDrop: ["ALL"],
        SecurityOpt: ["no-new-privileges"],
        NetworkMode: espec.red,
        RestartPolicy: { Name: "unless-stopped" },
      },
    });
    await contenedor.start();
    return { id: contenedor.id, host: espec.nombre };
  }

  async iniciar(contenedorId: string): Promise<void> {
    await this.ignorar([ESTADO_YA_HECHO], () => this.docker.getContainer(contenedorId).start());
  }

  async detener(contenedorId: string): Promise<void> {
    await this.ignorar([ESTADO_YA_HECHO, ESTADO_NO_EXISTE], () =>
      this.docker.getContainer(contenedorId).stop({ t: SEGUNDOS_PARA_DETENER }),
    );
  }

  async eliminar(contenedorId: string): Promise<void> {
    await this.ignorar([ESTADO_NO_EXISTE], () => this.docker.getContainer(contenedorId).remove({ force: true }));
  }

  /** Los contenedores del proyecto llevan la etiqueta con su red (`crear`). */
  async eliminarContenedoresDe(subdominio: string): Promise<void> {
    const contenedores = await this.docker.listContainers({
      all: true,
      filters: { label: [`${ETIQUETA_DEPLOYA}=${redDeProyecto(subdominio)}`] },
    });
    for (const { Id } of contenedores) await this.eliminar(Id);
  }

  async eliminarImagen(imagen: string): Promise<void> {
    await this.ignorar([ESTADO_NO_EXISTE], () => this.docker.getImage(imagen).remove({ force: true }));
  }

  async eliminarImagenesDe(subdominio: string): Promise<void> {
    const imagenes = await this.docker.listImages({ filters: { reference: [`${PREFIJO_IMAGEN}/${subdominio}`] } });
    for (const { Id } of imagenes) {
      await this.ignorar([ESTADO_NO_EXISTE, ESTADO_CONFLICTO], () => this.docker.getImage(Id).remove({ force: true }));
    }
  }

  async bitacora(contenedorId: string, { desde, max }: ConsultaSalida): Promise<LineaSalida[]> {
    const salida = await this.docker.getContainer(contenedorId).logs({
      follow: false,
      stdout: true,
      stderr: true,
      timestamps: true,
      tail: max,
      ...(desde ? { since: desde.getTime() / MS_POR_SEGUNDO } : {}),
    });
    return lineasDeSalida(demultiplexar(salida));
  }

  private async asegurarRed(nombre: string): Promise<void> {
    const existentes = await this.docker.listNetworks({ filters: { name: [nombre] } });
    if (!existentes.some((red) => red.Name === nombre)) {
      await this.docker.createNetwork({ Name: nombre, Driver: "bridge", Labels: { [ETIQUETA_DEPLOYA]: nombre } });
    }
    const red = this.docker.getNetwork(nombre);
    for (const servicio of this.serviciosConectados) {
      // Ya conectado: Docker responde 403 o 409 según la versión.
      await this.ignorar([ESTADO_PROHIBIDO, ESTADO_CONFLICTO], () => red.connect({ Container: servicio }));
    }
  }

  private async eliminarSiExiste(nombre: string): Promise<void> {
    await this.ignorar([ESTADO_NO_EXISTE], () => this.docker.getContainer(nombre).remove({ force: true }));
  }

  private async ignorar(estados: number[], accion: () => Promise<unknown>): Promise<void> {
    try {
      await accion();
    } catch (error) {
      if (!estados.includes((error as { statusCode?: number }).statusCode ?? 0)) throw error;
    }
  }
}
