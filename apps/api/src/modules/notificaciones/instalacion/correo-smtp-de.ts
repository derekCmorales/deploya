import { CorreoSmtpAdaptador } from "../adaptadores/correo-smtp.adaptador";
import type { TransporteSmtp } from "../adaptadores/correo-smtp.adaptador";
import type { ConfiguracionCorreo } from "../configuracion-correo";
import type { CorreoPuerto } from "../puertos/correo.puerto";
import type { SmtpEnClaro } from "../puertos/prueba-correo.puerto";

/** Arma el `CorreoPuerto` de un SMTP dado (guardado o en prueba). Token de Nest: las pruebas no abren conexiones. */
export type FabricaCorreoSmtp = (smtp: SmtpEnClaro) => CorreoPuerto;
export const FABRICA_CORREO_SMTP = Symbol("FABRICA_CORREO_SMTP");

/** La misma configuración que leen las `SMTP_*` del entorno, pero con los datos de la instalación. */
export function configuracionDeSmtp(smtp: SmtpEnClaro): ConfiguracionCorreo {
  return { adaptador: "smtp", host: smtp.host, puerto: smtp.puerto, usuario: smtp.usuario, clave: smtp.contrasena, remitente: smtp.remitente };
}

export function fabricaCorreoSmtp(crearTransporte: (configuracion: ConfiguracionCorreo) => TransporteSmtp): FabricaCorreoSmtp {
  return (smtp) => new CorreoSmtpAdaptador(crearTransporte(configuracionDeSmtp(smtp)), smtp.remitente);
}
