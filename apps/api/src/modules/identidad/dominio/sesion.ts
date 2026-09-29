import type { Rol } from "./cuenta";

/** `Sesion` de datos-nucleo.md: la cookie lleva el token; la base solo su huella. */
export interface Sesion {
  id: string;
  usuarioId: string;
  hashToken: string;
  creada: Date;
  ultimaActividad: Date;
  revocadaEn: Date | null;
}

export type NuevaSesion = Omit<Sesion, "id" | "revocadaEn"> & { agenteUsuario: string | null };

/** Lo que el guard deja en `request.usuario` y lee `@UsuarioActual()`. */
export interface UsuarioSesion {
  id: string;
  correo: string;
  nombre: string;
  rol: Rol;
}

export const DIAS_INACTIVIDAD_SESION = 7;
export const MS_POR_DIA = 24 * 60 * 60 * 1000;
/** No se escribe `ultimaActividad` en cada petición del sondeo: basta con refrescarla cada 5 min. */
export const MS_REFRESCO_ACTIVIDAD = 5 * 60 * 1000;

/** Vigente = no revocada y con actividad en los últimos 7 días. */
export function sesionVigente(sesion: Sesion | null, ahora: Date): sesion is Sesion {
  if (!sesion || sesion.revocadaEn) return false;
  return ahora.getTime() - sesion.ultimaActividad.getTime() < DIAS_INACTIVIDAD_SESION * MS_POR_DIA;
}

export function debeRefrescarActividad(sesion: Sesion, ahora: Date): boolean {
  return ahora.getTime() - sesion.ultimaActividad.getTime() >= MS_REFRESCO_ACTIVIDAD;
}
