import { PLANTILLA_PRUEBA } from "../dominio/plantilla-prueba";
import { PruebaCorreoPuerto, type SmtpEnClaro } from "../puertos/prueba-correo.puerto";
import type { FabricaCorreoSmtp } from "./correo-smtp-de";

/** Manda el correo de prueba por el SMTP recibido, sin guardarlo ni pasar por el registro de envíos. */
export class PruebaCorreoSmtp extends PruebaCorreoPuerto {
  constructor(private readonly fabricar: FabricaCorreoSmtp) {
    super();
  }

  async probar(smtp: SmtpEnClaro, destinatario: string, enlace: string): Promise<void> {
    await this.fabricar(smtp).enviar(destinatario, PLANTILLA_PRUEBA, { enlace });
  }
}
