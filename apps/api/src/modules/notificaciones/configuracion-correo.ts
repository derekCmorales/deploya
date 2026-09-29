import { CorreoConsolaAdaptador } from "./adaptadores/correo-consola.adaptador";
import { CorreoSmtpAdaptador, type TransporteSmtp } from "./adaptadores/correo-smtp.adaptador";
import type { CorreoPuerto } from "./puertos/correo.puerto";

export type AdaptadorCorreo = "smtp" | "consola";

/** Variables de ADR 0001, leídas una sola vez (valores por defecto: Mailpit local). */
export interface ConfiguracionCorreo {
  adaptador: AdaptadorCorreo;
  host: string;
  puerto: number;
  usuario: string;
  clave: string;
  remitente: string;
}

const PUERTO_MAILPIT = 1025;

export function configuracionCorreoDesde(entorno: NodeJS.ProcessEnv): ConfiguracionCorreo {
  return {
    adaptador: entorno.CORREO_ADAPTADOR === "consola" ? "consola" : "smtp",
    host: entorno.SMTP_HOST ?? "localhost",
    puerto: Number(entorno.SMTP_PORT ?? PUERTO_MAILPIT),
    usuario: entorno.SMTP_USUARIO ?? "",
    clave: entorno.SMTP_CLAVE ?? "",
    remitente: entorno.CORREO_REMITENTE ?? "Deploya <no-responder@deploya.localhost>",
  };
}

/** Único lugar que decide el adaptador de correo (OCP: uno nuevo es una rama aquí). */
export function correoSegun(
  configuracion: ConfiguracionCorreo,
  crearTransporte: (c: ConfiguracionCorreo) => TransporteSmtp,
): CorreoPuerto {
  if (configuracion.adaptador === "consola") return new CorreoConsolaAdaptador();
  return new CorreoSmtpAdaptador(crearTransporte(configuracion), configuracion.remitente);
}
