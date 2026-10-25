/**
 * Modo de instalación en la web (SP-06, contrato instalacion.md): `GET /instalacion/modo`.
 * En autoalojado no hay Suscripción, Planes ni Pagos. Lógica pura para probarla con `node --test`.
 */
export type ModoInstalacion = "nube" | "autoalojado";

export interface EstadoModo {
  modo: ModoInstalacion;
  /** `false` mientras la instalación no tenga administrador (el asistente 31 lo resuelve). */
  configurada: boolean;
}

export const RUTA_MODO_INSTALACION = "/instalacion/modo";

/** Lo que se asume mientras la API no responde: la nube, como antes del sprint. */
export const MODO_POR_DEFECTO: EstadoModo = { modo: "nube", configurada: true };

/** Rutas de cobro (06, 07, 08, 09): solo existen en la nube. */
export const RUTAS_SOLO_NUBE = ["/suscripcion", "/planes", "/pagos"] as const;

export function hayCobro(modo: ModoInstalacion): boolean {
  return modo === "nube";
}

/** Quita de la navegación lo que apunta a una ruta de cobro cuando no hay cobro. */
export function navegacionSegunModo<T extends { href: string }>(items: readonly T[], modo: ModoInstalacion): T[] {
  if (hayCobro(modo)) return [...items];
  return items.filter((item) => !RUTAS_SOLO_NUBE.some((ruta) => item.href === ruta || item.href.startsWith(`${ruta}/`)));
}
