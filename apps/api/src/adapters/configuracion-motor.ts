import { tmpdir } from "node:os";
import { join } from "node:path";
import { configuracionEnrutamientoDesde, type ConfiguracionEnrutamiento } from "../modules/enrutamiento/configuracion-enrutamiento";

export type ModoAdaptadores = "docker" | "stub";

/** Configuración del motor leída una sola vez del entorno (valores por defecto para desarrollo). */
export interface ConfiguracionMotor {
  modo: ModoAdaptadores;
  redisUrl: string;
  enrutamiento: ConfiguracionEnrutamiento;
  /** `acme.json` de Traefik, montado de solo lectura, para mostrar el vencimiento del certificado. */
  acmeArchivo: string;
  traefikDinamico: string;
  traefikContenedor: string;
  trabajadorContenedor: string;
  trabajadorConcurrencia: number;
  directorioTrabajo: string;
  /** Proyecto de compose de deploya: cuenta sus contenedores en Admin · Instalación (SP-18). */
  proyectoCompose: string;
}

export const CONFIGURACION_MOTOR = Symbol("CONFIGURACION_MOTOR");

export function configuracionDesde(entorno: NodeJS.ProcessEnv): ConfiguracionMotor {
  return {
    modo: entorno.MOTOR_ADAPTADORES === "docker" ? "docker" : "stub",
    redisUrl: entorno.REDIS_URL ?? "redis://localhost:6379",
    enrutamiento: configuracionEnrutamientoDesde(entorno),
    acmeArchivo: entorno.ACME_ARCHIVO ?? "/acme/acme.json",
    traefikDinamico: entorno.TRAEFIK_DINAMICO ?? "/traefik/dinamico",
    traefikContenedor: entorno.TRAEFIK_CONTENEDOR ?? "deploya-traefik",
    trabajadorContenedor: entorno.TRABAJADOR_CONTENEDOR ?? "deploya-worker",
    trabajadorConcurrencia: Number(entorno.TRABAJADOR_CONCURRENCIA ?? 1),
    directorioTrabajo: entorno.DIRECTORIO_TRABAJO ?? join(tmpdir(), "deploya"),
    proyectoCompose: entorno.COMPOSE_PROJECT_NAME ?? "deploya",
  };
}
