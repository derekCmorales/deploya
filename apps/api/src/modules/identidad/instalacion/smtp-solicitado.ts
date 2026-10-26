import type { SmtpEnClaro } from "../../notificaciones";
import { DatosCorreoInvalidos } from "./errores";

const PUERTO_MINIMO = 1;
const PUERTO_MAXIMO = 65535;

function texto(cuerpo: Record<string, unknown>, campo: string, obligatorio: boolean): string {
  const valor = cuerpo[campo];
  if (typeof valor !== "string" || (obligatorio && valor.trim() === "")) throw new DatosCorreoInvalidos(campo);
  return valor.trim();
}

/** `smtp` de `POST /instalacion/correo/prueba` y `PATCH /instalacion/correo` (contrato instalacion.md). */
export function smtpDe(cuerpo: unknown): SmtpEnClaro {
  const smtp = typeof cuerpo === "object" && cuerpo !== null ? (cuerpo as Record<string, unknown>).smtp : undefined;
  if (typeof smtp !== "object" || smtp === null) throw new DatosCorreoInvalidos("smtp");
  const datos = smtp as Record<string, unknown>;
  const puerto = datos.puerto;
  if (typeof puerto !== "number" || !Number.isInteger(puerto) || puerto < PUERTO_MINIMO || puerto > PUERTO_MAXIMO) {
    throw new DatosCorreoInvalidos("puerto");
  }
  return {
    host: texto(datos, "host", true),
    puerto,
    usuario: texto(datos, "usuario", false),
    // La contraseña no se recorta: puede empezar o terminar con espacios.
    contrasena: typeof datos.contrasena === "string" ? datos.contrasena : "",
    remitente: texto(datos, "remitente", true),
  };
}

export function eligeSinCorreo(cuerpo: unknown): boolean {
  return typeof cuerpo === "object" && cuerpo !== null && (cuerpo as Record<string, unknown>).sinCorreo === true;
}
