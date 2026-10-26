import { createTransport } from "nodemailer";
import type { ConfiguracionCorreo } from "../configuracion-correo";
import type { TransporteSmtp } from "./correo-smtp.adaptador";

const PUERTO_SMTPS = 465;

/**
 * Sin estos límites nodemailer espera hasta 2 min la conexión y 10 min el socket: «Enviar correo
 * de prueba» (31) se quedaría cargando con un servidor que no responde.
 */
export const LIMITES_SMTP_MS = { conexion: 10_000, saludo: 10_000, socket: 20_000 } as const;

/** Único archivo que conoce nodemailer (ADR 0001); las pruebas usan un transporte falso. */
export function transporteNodemailer(configuracion: ConfiguracionCorreo): TransporteSmtp {
  return createTransport({
    host: configuracion.host,
    port: configuracion.puerto,
    secure: configuracion.puerto === PUERTO_SMTPS,
    auth: configuracion.usuario ? { user: configuracion.usuario, pass: configuracion.clave } : undefined,
    connectionTimeout: LIMITES_SMTP_MS.conexion,
    greetingTimeout: LIMITES_SMTP_MS.saludo,
    socketTimeout: LIMITES_SMTP_MS.socket,
  });
}
