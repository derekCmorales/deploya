import type { Request } from "express";

/**
 * IP de quien llama, para los límites de intentos. Con `trust proxy` (main.ts) es la del cliente
 * aunque la API esté detrás de Traefik.
 */
export function origenDe(solicitud: Request): string {
  return solicitud.ip ?? "desconocido";
}
