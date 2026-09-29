import { CorreoNoEnviado } from "../dominio/errores";
import type { PlantillaCorreo } from "../dominio/plantilla-correo";
import { CorreoPuerto } from "../puertos/correo.puerto";

/** Lo único que el adaptador usa de nodemailer; permite probarlo sin abrir conexiones. */
export interface TransporteSmtp {
  sendMail(opciones: { from: string; to: string; subject: string; html: string; text: string }): Promise<unknown>;
}

/**
 * Adapter SMTP (ADR 0001): el mismo en desarrollo (Mailpit) y en el VPS (Resend, Brevo…).
 * Cambiar de proveedor es cambiar las variables `SMTP_*`, no esta clase.
 */
export class CorreoSmtpAdaptador extends CorreoPuerto {
  constructor(
    private readonly transporte: TransporteSmtp,
    private readonly remitente: string,
  ) {
    super();
  }

  async enviar<D extends { enlace: string }>(destinatario: string, plantilla: PlantillaCorreo<D>, datos: D): Promise<void> {
    const mensaje = plantilla.componer(datos);
    try {
      await this.transporte.sendMail({
        from: this.remitente,
        to: destinatario,
        subject: mensaje.asunto,
        html: mensaje.html,
        text: mensaje.texto,
      });
    } catch (error) {
      throw new CorreoNoEnviado(destinatario, error instanceof Error ? error.message : String(error));
    }
  }
}
