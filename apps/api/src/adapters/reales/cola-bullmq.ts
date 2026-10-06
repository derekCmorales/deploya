import { Queue, Worker, type ConnectionOptions } from "bullmq";
import type { TrabajoDespliegue } from "../../modules/construccion/dominio/despliegue";
import { COLA_DESPLIEGUES, COLA_OPERACION } from "../../modules/construccion/dominio/motor.constantes";
import { ColaConstruccionPuerto } from "../../modules/construccion/puertos/cola-construccion.puerto";
import type { AccionContenedor } from "../../modules/orquestacion/dominio/accion-contenedor";
import { ColaOperacionPuerto } from "../../modules/orquestacion/puertos/cola-operacion.puerto";

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
 * Productor de la cola `operacion` (M5-02). `jobId = proyectoId:tipo` evita pedir dos veces lo
 * mismo mientras está pendiente; al terminar se borra para que se pueda volver a pedir.
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
      jobId: `${accion.proyectoId}:${accion.tipo}`,
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
