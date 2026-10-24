import { Redis } from "ioredis";
import type { EnvioCorreo } from "../../modules/notificaciones/puertos/registro-envios.puerto";
import { RegistroEnviosCorreo } from "../../modules/notificaciones/puertos/registro-envios.puerto";
import { ReporteServidorPuerto, type ReporteServidor } from "../../modules/administracion/instalacion/puertos/reporte-servidor.puerto";
import { conexionRedis } from "./cola-bullmq";

export const CLAVE_ULTIMO_ENVIO = "instalacion:correo:ultimo";
export const CLAVE_REPORTE_SERVIDOR = "instalacion:servidor:reporte";

/** JSON con fechas: las claves de fecha vuelven a `Date`. */
function leerJson<T>(texto: string | null, fechas: readonly string[]): T | null {
  if (!texto) return null;
  const crudo = JSON.parse(texto) as Record<string, unknown>;
  for (const clave of fechas) crudo[clave] = new Date(String(crudo[clave]));
  return crudo as T;
}

/** Último envío de correo en Redis: lo escriben la API y el trabajador; lo lee la 32 (SP-18). */
export class RegistroEnviosRedis extends RegistroEnviosCorreo {
  private readonly redis: Redis;

  constructor(redisUrl: string) {
    super();
    this.redis = new Redis({ ...conexionRedis(redisUrl), lazyConnect: true });
  }

  async registrar(envio: EnvioCorreo): Promise<void> {
    await this.redis.set(CLAVE_ULTIMO_ENVIO, JSON.stringify(envio));
  }

  async ultimo(): Promise<EnvioCorreo | null> {
    return leerJson<EnvioCorreo>(await this.redis.get(CLAVE_ULTIMO_ENVIO), ["en"]);
  }
}

/** Último reporte del servidor en Redis: lo publica el trabajador cada 10 min (SP-18). */
export class ReporteServidorRedis extends ReporteServidorPuerto {
  private readonly redis: Redis;

  constructor(redisUrl: string) {
    super();
    this.redis = new Redis({ ...conexionRedis(redisUrl), lazyConnect: true });
  }

  async publicar(reporte: ReporteServidor): Promise<void> {
    await this.redis.set(CLAVE_REPORTE_SERVIDOR, JSON.stringify(reporte));
  }

  async ultimo(): Promise<ReporteServidor | null> {
    return leerJson<ReporteServidor>(await this.redis.get(CLAVE_REPORTE_SERVIDOR), ["tomado"]);
  }
}
