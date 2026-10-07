import { CorreoInvalido } from "./errores";

/** Valores de docs/contratos/datos-nucleo.md y de `ESTADOS_CUENTA` de la web. */
export type Rol = "cliente" | "administrador";
export type EstadoCuenta = "pendiente" | "activa" | "suspendida";
export type TipoTokenCuenta = "verificacion" | "recuperacion";

export interface Usuario {
  id: string;
  correo: string;
  nombre: string;
  hashContrasena: string;
  rol: Rol;
  estadoCuenta: EstadoCuenta;
  /** Pantalla 03b: lo escribe M9 al suspender; `null` si nunca se suspendió. */
  motivoSuspension: string | null;
  /** Fecha de la suspensión vigente (la `AccionAdministrativa` más reciente de M9); `null` si no consta. */
  suspendidaDesde: Date | null;
  creado: Date;
}

export type NuevoUsuario = Omit<Usuario, "id" | "motivoSuspension" | "suspendidaDesde">;

export interface TokenCuenta {
  id: string;
  usuarioId: string;
  tipo: TipoTokenCuenta;
  hashToken: string;
  expira: Date;
  usadoEn: Date | null;
  creado: Date;
}

export type NuevoTokenCuenta = Omit<TokenCuenta, "id" | "usadoEn">;

export const HORAS_VIGENCIA_VERIFICACION = 24;
export const MS_POR_HORA = 60 * 60 * 1000;
export const VIGENCIA_RECUPERACION_MS = 30 * 60 * 1000;
export const LARGO_MAXIMO_NOMBRE = 64;

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OCULTO = "•••";
const MAXIMO_OCULTOS_DOMINIO = 7;

/** Correo único en minúsculas y sin espacios (datos-nucleo.md). */
export function normalizarCorreo(correo: string): string {
  const normalizado = correo.trim().toLowerCase();
  if (!FORMATO_CORREO.test(normalizado)) throw new CorreoInvalido(correo);
  return normalizado;
}

/** Pantalla 01 no pide nombre: sale de la parte local del correo («derek@…» → «Derek»). */
export function nombreDesdeCorreo(correo: string): string {
  const [primera = correo] = correo.split("@")[0].split(/[._+-]/).filter(Boolean);
  const nombre = primera.charAt(0).toUpperCase() + primera.slice(1);
  return nombre.slice(0, LARGO_MAXIMO_NOMBRE);
}

function ocultarExtremos(texto: string, ocultos: string): string {
  if (texto.length <= 1) return `${texto}${ocultos}`;
  return `${texto.charAt(0)}${ocultos}${texto.charAt(texto.length - 1)}`;
}

/** Pantallas 01b y 02: «ana.gomez@tiendademo.com» → «a•••z@t•••••••o.com». */
export function enmascararCorreo(correo: string): string {
  const [local, dominio] = correo.split("@");
  const punto = dominio.lastIndexOf(".");
  const nombreDominio = dominio.slice(0, punto);
  const ocultosDominio = "•".repeat(Math.min(Math.max(nombreDominio.length - 2, 1), MAXIMO_OCULTOS_DOMINIO));
  return `${ocultarExtremos(local, OCULTO)}@${ocultarExtremos(nombreDominio, ocultosDominio)}${dominio.slice(punto)}`;
}

/** Vigente = no usado y antes de su expiración. */
export function motivoInvalidez(token: TokenCuenta | null, ahora: Date): "inexistente" | "expirado" | "usado" | null {
  if (!token) return "inexistente";
  if (token.usadoEn) return "usado";
  if (ahora.getTime() >= token.expira.getTime()) return "expirado";
  return null;
}
