import { createTransport } from "nodemailer";
import type { ConfiguracionCorreo } from "../configuracion-correo";
import type { TransporteSmtp } from "./correo-smtp.adaptador";

const PUERTO_SMTPS = 465;

/** Único archivo que conoce nodemailer (ADR 0001); las pruebas usan un transporte falso. */
export function transporteNodemailer(configuracion: ConfiguracionCorreo): TransporteSmtp {
  return createTransport({
    host: configuracion.host,
    port: configuracion.puerto,
    secure: configuracion.puerto === PUERTO_SMTPS,
    auth: configuracion.usuario ? { user: configuracion.usuario, pass: configuracion.clave } : undefined,
  });
}
