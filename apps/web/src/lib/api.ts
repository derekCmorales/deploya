/**
 * Cliente HTTP de la API. Único lugar de la web que llama a `fetch`: los componentes
 * usan los hooks de `@/hooks`. Manda la cookie de sesión (`credentials: "include"`).
 */

import { EVENTO_SIN_SESION } from "@/lib/sesion-expirada";

export const URL_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Dominio y esquema de las apps publicadas (`<subdominio>.localhost` en desarrollo). */
export const DOMINIO_APPS = process.env.NEXT_PUBLIC_DOMINIO_APPS ?? "localhost";
export const ESQUEMA_APPS = process.env.NEXT_PUBLIC_ESQUEMA_APPS ?? "http";

const SIN_CONEXION = 0;
const HTTP_NO_AUTENTICADO = 401;

/** M1-04: un 401 en cualquier pantalla hace que `SesionProvider` revise si la sesión venció. */
function avisarSinSesion(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO_SIN_SESION));
}

/** Error con el cuerpo `{ codigo, mensaje, ...detalle }` que devuelven los filtros de la API. */
export class ErrorApi extends Error {
  constructor(
    readonly estado: number,
    readonly codigo: string,
    mensaje: string,
    readonly detalle: Record<string, unknown> = {},
  ) {
    super(mensaje);
    this.name = "ErrorApi";
  }

  get sinSesion(): boolean {
    return this.estado === HTTP_NO_AUTENTICADO;
  }
}

export async function pedirApi<T>(ruta: string, opciones: { metodo?: "GET" | "POST" | "DELETE"; cuerpo?: unknown } = {}): Promise<T> {
  const respuesta = await enviar(ruta, opciones);
  const json = (await respuesta.json().catch(() => ({}))) as Record<string, unknown>;
  if (respuesta.ok) return json as T;
  if (respuesta.status === HTTP_NO_AUTENTICADO) avisarSinSesion();
  const { codigo, mensaje, message, ...detalle } = json;
  throw new ErrorApi(
    respuesta.status,
    typeof codigo === "string" ? codigo : `http-${respuesta.status}`,
    textoDe(mensaje) ?? textoDe(message) ?? "No pudimos completar la operación.",
    detalle,
  );
}

async function enviar(ruta: string, { metodo = "GET", cuerpo }: { metodo?: string; cuerpo?: unknown }): Promise<Response> {
  try {
    return await fetch(`${URL_API}${ruta}`, {
      method: metodo,
      credentials: "include",
      headers: cuerpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ErrorApi(SIN_CONEXION, "sin-conexion", "No pudimos conectar con la API. Revisa tu conexión e intenta de nuevo.");
  }
}

function textoDe(valor: unknown): string | undefined {
  if (typeof valor === "string") return valor;
  if (Array.isArray(valor) && typeof valor[0] === "string") return valor[0];
  return undefined;
}
