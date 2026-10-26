/** SMTP con la contraseña en claro: solo vive durante la petición del asistente o un envío. */
export interface SmtpEnClaro {
  host: string;
  puerto: number;
  usuario: string;
  contrasena: string;
  remitente: string;
}

/**
 * «Enviar correo de prueba» (31 y 32, SP-17): manda un correo por un SMTP que todavía no se
 * guardó. Lanza `CorreoNoEnviado` con lo que respondió el servidor.
 */
export abstract class PruebaCorreoPuerto {
  abstract probar(smtp: SmtpEnClaro, destinatario: string, enlace: string): Promise<void>;
}
