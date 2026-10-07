import { DIAS_INACTIVIDAD_SESION } from "./dominio/sesion";

export const COOKIE_SESION = "deploya_sesion";
const SEGUNDOS_POR_DIA = 24 * 60 * 60;

/** Configuración de la cookie leída del entorno: `Secure` solo cuando la web va por HTTPS (VPS). */
export interface ConfiguracionCookie {
  segura: boolean;
}

export function configuracionCookieDesde(entorno: NodeJS.ProcessEnv): ConfiguracionCookie {
  return { segura: (entorno.URL_WEB ?? "").startsWith("https://") };
}

/** Lee una cookie del encabezado `Cookie` sin dependencias (cookie-parser no hace falta para una). */
export function leerCookie(encabezado: string | undefined, nombre: string): string | null {
  if (!encabezado) return null;
  for (const parte of encabezado.split(";")) {
    const [clave, ...valor] = parte.trim().split("=");
    if (clave === nombre) return decodeURIComponent(valor.join("="));
  }
  return null;
}

function atributos(configuracion: ConfiguracionCookie, maxAge: number): string {
  const base = ["Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAge}`];
  if (configuracion.segura) base.push("Secure");
  return base.join("; ");
}

/** HttpOnly (la web nunca lee el token), SameSite=Lax y 7 días, igual que la inactividad. */
export function cookieSesion(token: string, configuracion: ConfiguracionCookie): string {
  return `${COOKIE_SESION}=${encodeURIComponent(token)}; ${atributos(configuracion, DIAS_INACTIVIDAD_SESION * SEGUNDOS_POR_DIA)}`;
}

export function cookieSesionVencida(configuracion: ConfiguracionCookie): string {
  return `${COOKIE_SESION}=; ${atributos(configuracion, 0)}`;
}
