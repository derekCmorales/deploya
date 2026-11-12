import { Queue, Worker, type ConnectionOptions } from "bullmq";
import type { TrabajoDespliegue } from "../../modules/construccion/dominio/despliegue";
import { COLA_DESPLIEGUES, COLA_OPERACION } from "../../modules/construccion/dominio/motor.constantes";
import { ColaConstruccionPuerto } from "../../modules/construccion/puertos/cola-construccion.puerto";
import type { AccionContenedor } from "../../modules/orquestacion/dominio/accion-contenedor";
import { ColaOperacionPuerto } from "../../modules/orquestacion/puertos/cola-operacion.puerto";
import { COLA_DATOS } from "../../modules/datos/datos.constantes";
import type { ComandoDatos } from "../../modules/datos/dominio/comando-datos";
import { ColaDatosPuerto } from "../../modules/datos/puertos/cola-datos.puerto";

const TRABAJOS_CONSERVADOS = 1000;
const INTENTOS_OPERACION = 3;
const ESPERA_INICIAL_OPERACION_MS = 2000;

export function conexionRedis(redisUrl: string): ConnectionOptions {
  const url = new URL(redisUrl);
  return { host: url.hostname, port: Number(url.port || 6379), maxRetriesPerRequest: null };
}

/**
 * Productor BullMQ. `jobId = despliegueId` hace idempotente el encolado; sin
 * reintentos automáticos: reintentar es una acción del cliente (ADR 0002).
 */
export class ColaBullMq extends ColaConstruccionPuerto {
  private readonly cola: Queue<TrabajoDespliegue>;

  constructor(redisUrl: string) {
    super();
    this.cola = new Queue<TrabajoDespliegue>(COLA_DESPLIEGUES, { connection: conexionRedis(redisUrl) });
  }

  async encolar(trabajo: TrabajoDespliegue): Promise<void> {
    await this.cola.add(trabajo.plan, trabajo, {
      jobId: trabajo.despliegueId,
      attempts: 1,
      removeOnComplete: TRABAJOS_CONSERVADOS,
      removeOnFail: TRABAJOS_CONSERVADOS,
    });
  }

  /** Solo se puede sacar un trabajo que espera; si el trabajador ya lo tomó, BullMQ lo rechaza y se devuelve `false`. */
  async quitar(despliegueId: string): Promise<boolean> {
    const trabajo = await this.cola.getJob(despliegueId);
    if (!trabajo) return false;
    try {
      await trabajo.remove();
      return true;
    } catch {
      return false;
    }
  }

  async cerrar(): Promise<void> {
    await this.cola.close();
  }
}

/** Consumidor BullMQ: entrega cada trabajo al manejador (el pipeline) en el trabajador. */
export function consumirDespliegues(
  redisUrl: string,
  concurrencia: number,
  manejador: (trabajo: TrabajoDespliegue) => Promise<void>,
): Worker<TrabajoDespliegue> {
  return new Worker<TrabajoDespliegue>(COLA_DESPLIEGUES, (trabajo) => manejador(trabajo.data), {
    connection: conexionRedis(redisUrl),
    concurrency: concurrencia,
  });
}

/**
 * `jobId` de una acción: uno por proyecto y tipo. BullMQ rechaza ids con `:` (separador de
 * claves en Redis) y los que son enteros.
 */
export function idTrabajoOperacion(accion: AccionContenedor): string {
  return `${accion.tipo}-${accion.proyectoId}`;
}

/**
 * Productor de la cola `operacion` (M5-02). El `jobId` evita pedir dos veces lo mismo
 * mientras está pendiente; al terminar se borra para que se pueda volver a pedir.
 * Reintenta 3 veces con espera exponencial: una acción no es una construcción.
 */
export class ColaOperacionBullMq extends ColaOperacionPuerto {
  private readonly cola: Queue<AccionContenedor>;

  constructor(redisUrl: string) {
    super();
    this.cola = new Queue<AccionContenedor>(COLA_OPERACION, { connection: conexionRedis(redisUrl) });
  }

  async encolar(accion: AccionContenedor): Promise<void> {
    await this.cola.add(accion.tipo, accion, {
      jobId: idTrabajoOperacion(accion),
      attempts: INTENTOS_OPERACION,
      backoff: { type: "exponential", delay: ESPERA_INICIAL_OPERACION_MS },
      removeOnComplete: true,
      removeOnFail: true,
    });
  }

  async cerrar(): Promise<void> {
    await this.cola.close();
  }
}

/** Consumidor de la cola `operacion`; concurrencia 1 para no reiniciar y detener a la vez. */
export function consumirOperaciones(redisUrl: string, manejador: (accion: AccionContenedor) => Promise<void>): Worker<AccionContenedor> {
  return new Worker<AccionContenedor>(COLA_OPERACION, (trabajo) => manejador(trabajo.data), {
    connection: conexionRedis(redisUrl),
    concurrency: 1,
  });
}

/**
 * Productor de la cola `datos` (feat/m5-recursos-datos). Sin `jobId` fijo: el orden importa
 * (detener, iniciar, detener) y el consumidor va de uno en uno. Crear no se reintenta: el
 * trabajador deja el recurso en `error` con el detalle; lo demás reintenta como una acción.
 */
export class ColaDatosBullMq extends ColaDatosPuerto {
  private readonly cola: Queue<ComandoDatos>;

  constructor(redisUrl: string) {
    super();
    this.cola = new Queue<ComandoDatos>(COLA_DATOS, { connection: conexionRedis(redisUrl) });
  }

  async encolar(comando: ComandoDatos): Promise<void> {
    const reintenta = comando.accion !== "crear";
    await this.cola.add(comando.accion, comando, {
      attempts: reintenta ? INTENTOS_OPERACION : 1,
      backoff: { type: "exponential", delay: ESPERA_INICIAL_OPERACION_MS },
      removeOnComplete: true,
      removeOnFail: TRABAJOS_CONSERVADOS,
    });
  }

  async cerrar(): Promise<void> {
    await this.cola.close();
  }
}

/** Consumidor de la cola `datos`; concurrencia 1 para que crear, compartir y eliminar no se crucen. */
export function consumirDatos(redisUrl: string, manejador: (comando: ComandoDatos) => Promise<void>): Worker<ComandoDatos> {
  return new Worker<ComandoDatos>(COLA_DATOS, (trabajo) => manejador(trabajo.data), {
    connection: conexionRedis(redisUrl),
    concurrency: 1,
  });
}
