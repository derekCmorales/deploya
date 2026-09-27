import { tmpdir } from "node:os";
import { join } from "node:path";

export type ModoAdaptadores = "docker" | "stub";

/** Configuración del motor leída una sola vez del entorno (valores por defecto para desarrollo). */
export interface ConfiguracionMotor {
  modo: ModoAdaptadores;
  redisUrl: string;
  dominioApps: string;
  esquemaApps: string;
  traefikDinamico: string;
  traefikContenedor: string;
  trabajadorContenedor: string;
  trabajadorConcurrencia: number;
  directorioTrabajo: string;
}

export const CONFIGURACION_MOTOR = Symbol("CONFIGURACION_MOTOR");

export function configuracionDesde(entorno: NodeJS.ProcessEnv): ConfiguracionMotor {
  return {
    modo: entorno.MOTOR_ADAPTADORES === "docker" ? "docker" : "stub",
    redisUrl: entorno.REDIS_URL ?? "redis://localhost:6379",
    dominioApps: entorno.DOMINIO_APPS ?? "localhost",
    esquemaApps: entorno.ESQUEMA_APPS ?? "http",
    traefikDinamico: entorno.TRAEFIK_DINAMICO ?? "/traefik/dinamico",
    traefikContenedor: entorno.TRAEFIK_CONTENEDOR ?? "deploya-traefik",
    trabajadorContenedor: entorno.TRABAJADOR_CONTENEDOR ?? "deploya-worker",
    trabajadorConcurrencia: Number(entorno.TRABAJADOR_CONCURRENCIA ?? 1),
    directorioTrabajo: entorno.DIRECTORIO_TRABAJO ?? join(tmpdir(), "deploya"),
  };
}
