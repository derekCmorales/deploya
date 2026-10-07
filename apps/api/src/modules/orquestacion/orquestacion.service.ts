import { Injectable } from "@nestjs/common";
import type { ProyectoDesplegable } from "../construccion/dominio/despliegue";
import { SaludNoAlcanzada } from "../construccion/dominio/errores";
import {
  nombreContenedor,
  redDeProyecto,
  RUTA_SALUD,
  TIEMPO_MAXIMO_SALUD_MS,
} from "../construccion/dominio/motor.constantes";
import { ContenedorPuerto, type ContenedorCreado } from "./puertos/contenedor.puerto";
import { CuotaPlanPuerto, type RecursosPlan } from "./puertos/cuota-plan.puerto";
import { VerificacionEntornoPuerto, type ResultadoSalud } from "./puertos/verificacion-entorno.puerto";

const MILISEGUNDOS_POR_SEGUNDO = 1000;

export interface SolicitudAprovisionamiento {
  proyecto: ProyectoDesplegable;
  numero: number;
  imagen: string;
  variables: Record<string, string>;
}

export interface Aprovisionado {
  contenedor: ContenedorCreado;
  recursos: RecursosPlan;
  salud: ResultadoSalud;
}

/** M5: corre la imagen con los límites del plan y verifica su salud. Nunca llama a Docker directo. */
@Injectable()
export class OrquestacionService {
  constructor(
    private readonly contenedores: ContenedorPuerto,
    private readonly salud: VerificacionEntornoPuerto,
    private readonly cuota: CuotaPlanPuerto,
  ) {}

  async aprovisionar(solicitud: SolicitudAprovisionamiento): Promise<Aprovisionado> {
    const { proyecto, numero, imagen, variables } = solicitud;
    const recursos = await this.cuota.recursosDe(proyecto.usuarioId);
    const contenedor = await this.contenedores.crear({
      nombre: nombreContenedor(proyecto.subdominio, numero),
      imagen,
      red: redDeProyecto(proyecto.subdominio),
      puertoInterno: proyecto.puertoInterno,
      cpus: recursos.cpus,
      memoriaMb: recursos.memoriaMb,
      variables,
    });
    const salud = await this.salud.saludable({
      host: contenedor.host,
      puerto: proyecto.puertoInterno,
      ruta: RUTA_SALUD,
      tiempoMaximoMs: TIEMPO_MAXIMO_SALUD_MS,
    });
    if (!salud.ok) {
      await this.contenedores.eliminar(contenedor.id);
      throw new SaludNoAlcanzada(TIEMPO_MAXIMO_SALUD_MS / MILISEGUNDOS_POR_SEGUNDO, salud.detalle);
    }
    return { contenedor, recursos, salud };
  }

  /** Arranca otra vez un contenedor existente y espera su salud (reiniciar, M5-02). Lanza `SaludNoAlcanzada`. */
  async reanudar(contenedorId: string, host: string, puerto: number): Promise<ResultadoSalud> {
    await this.contenedores.iniciar(contenedorId);
    const salud = await this.salud.saludable({ host, puerto, ruta: RUTA_SALUD, tiempoMaximoMs: TIEMPO_MAXIMO_SALUD_MS });
    if (!salud.ok) {
      await this.contenedores.detener(contenedorId);
      throw new SaludNoAlcanzada(TIEMPO_MAXIMO_SALUD_MS / MILISEGUNDOS_POR_SEGUNDO, salud.detalle);
    }
    return salud;
  }

  /** Lo que deja un proyecto eliminado: contenedores e imágenes. Idempotente. */
  async eliminarRecursosDe(subdominio: string): Promise<void> {
    await this.contenedores.eliminarContenedoresDe(subdominio);
    await this.contenedores.eliminarImagenesDe(subdominio);
  }

  async detenerContenedor(contenedorId: string): Promise<void> {
    await this.contenedores.detener(contenedorId);
  }

  async eliminarContenedor(contenedorId: string): Promise<void> {
    await this.contenedores.eliminar(contenedorId);
  }
}
