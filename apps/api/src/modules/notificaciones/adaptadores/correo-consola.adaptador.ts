import { Logger } from "@nestjs/common";
import { CorreoNoEnviado } from "../dominio/errores";
import type { PlantillaCorreo } from "../dominio/plantilla-correo";
import { CorreoPuerto } from "../puertos/correo.puerto";

export interface RegistroCorreo {
  log(mensaje: string): void;
}

/** Adapter para pruebas y para correr la API sin Mailpit: escribe el correo en el log. */
export class CorreoConsolaAdaptador extends CorreoPuerto {
  constructor(private readonly registro: RegistroCorreo = new Logger("Correo")) {
    super();
  }

  async enviar<D extends { enlace: string }>(destinatario: string, plantilla: PlantillaCorreo<D>, datos: D): Promise<void> {
    try {
      const mensaje = plantilla.componer(datos);
      this.registro.log(`Para: ${destinatario} · ${mensaje.asunto}\n${mensaje.texto}`);
    } catch (error) {
      throw new CorreoNoEnviado(destinatario, error instanceof Error ? error.message : String(error));
    }
  }
}
