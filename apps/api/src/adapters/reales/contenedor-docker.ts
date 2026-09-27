import type Docker from "dockerode";
import {
  ContenedorPuerto,
  type ContenedorCreado,
  type EspecContenedor,
} from "../../modules/orquestacion/puertos/contenedor.puerto";
import { limitesDesde } from "../../modules/orquestacion/dominio/limites-contenedor";

const SEGUNDOS_PARA_DETENER = 10;
const ESTADO_YA_HECHO = 304;
const ESTADO_NO_EXISTE = 404;
const ESTADO_PROHIBIDO = 403;
const ESTADO_CONFLICTO = 409;
const ETIQUETA_DEPLOYA = "app.deploya.proyecto";

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

  async detener(contenedorId: string): Promise<void> {
    await this.ignorar([ESTADO_YA_HECHO, ESTADO_NO_EXISTE], () =>
      this.docker.getContainer(contenedorId).stop({ t: SEGUNDOS_PARA_DETENER }),
    );
  }

  async eliminar(contenedorId: string): Promise<void> {
    await this.ignorar([ESTADO_NO_EXISTE], () => this.docker.getContainer(contenedorId).remove({ force: true }));
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
