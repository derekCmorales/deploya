import { Redis } from "ioredis";
import { TTL_CANCELACION_S } from "../../modules/construccion/dominio/motor.constantes";
import { CancelacionesPuerto } from "../../modules/construccion/puertos/cancelaciones.puerto";
import { conexionRedis } from "./cola-bullmq";

const PREFIJO_CLAVE = "cancelacion:";

export function claveCancelacion(despliegueId: string): string {
  return `${PREFIJO_CLAVE}${despliegueId}`;
}

/** La señal vive en Redis `cancelacion:<id>` con TTL: la API la escribe y el trabajador la lee. */
export class CancelacionesRedis extends CancelacionesPuerto {
  private readonly redis: Redis;

  constructor(redisUrl: string) {
    super();
    this.redis = new Redis({ ...conexionRedis(redisUrl), lazyConnect: true });
  }

  async pedir(despliegueId: string): Promise<void> {
    await this.redis.set(claveCancelacion(despliegueId), "1", "EX", TTL_CANCELACION_S);
  }

  async pedida(despliegueId: string): Promise<boolean> {
    return (await this.redis.exists(claveCancelacion(despliegueId))) === 1;
  }

  async cerrar(): Promise<void> {
    this.redis.disconnect();
  }
}
