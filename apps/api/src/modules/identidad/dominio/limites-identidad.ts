import { LimiteIntentos } from "./limite-intentos";

const MS_POR_MINUTO = 60 * 1000;
const MS_POR_HORA = 60 * MS_POR_MINUTO;

/** Spec «Límite de intentos» (EST-01a) y el código de configuración (SP-17). */
export const MAXIMO_FALLOS_SESION = 5;
export const VENTANA_SESION_MS = 15 * MS_POR_MINUTO;
export const MAXIMO_REGISTROS = 10;
export const VENTANA_REGISTRO_MS = MS_POR_HORA;
export const MAXIMO_CORREOS = 3;
export const VENTANA_CORREOS_MS = MS_POR_HORA;
export const MAXIMO_INTENTOS_CODIGO = 5;
export const VENTANA_INTENTOS_MS = 15 * MS_POR_MINUTO;

/**
 * Factory de los límites de M1: una instancia por regla, compartida por todo el proceso. Un límite
 * nuevo es otra propiedad aquí, no otro `if` en los servicios.
 */
export class LimitesIdentidad {
  /** Fallos de contraseña por `ip|correo`. */
  readonly sesion = new LimiteIntentos(MAXIMO_FALLOS_SESION, VENTANA_SESION_MS);
  /** Registros por IP. */
  readonly registro = new LimiteIntentos(MAXIMO_REGISTROS, VENTANA_REGISTRO_MS);
  /** Correos de verificación y de recuperación por correo (cada uno con su clave). */
  readonly correos = new LimiteIntentos(MAXIMO_CORREOS, VENTANA_CORREOS_MS);
  /** Códigos de configuración fallidos por IP (asistente 31). */
  readonly codigo = new LimiteIntentos(MAXIMO_INTENTOS_CODIGO, VENTANA_INTENTOS_MS);
}

/** Inicio de sesión: la IP y el correo juntos, para no bloquear a toda una red por un usuario. */
export function claveDeSesion(origen: string, correo: string): string {
  return `${origen}|${correo.trim().toLowerCase()}`;
}

export function claveDeCorreo(tipo: "verificacion" | "recuperacion", correo: string): string {
  return `${tipo}|${correo}`;
}
