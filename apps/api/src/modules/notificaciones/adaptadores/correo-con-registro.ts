import { Logger } from "@nestjs/common";
import type { Reloj } from "../../../compartido/reloj";
import { CorreoNoEnviado } from "../dominio/errores";
import type { PlantillaCorreo } from "../dominio/plantilla-correo";
import { CorreoPuerto } from "../puertos/correo.puerto";
import type { RegistroEnviosCorreo } from "../puertos/registro-envios.puerto";

/**
 * Decorator de `CorreoPuerto` (SP-18): anota si cada envío llegó o qué respondió el servidor,
 * para que Admin · Instalación muestre «El último envío falló hace 2 h». No cambia el contrato:
 * el error de envío se vuelve a lanzar igual, y un fallo al anotar no rompe el envío.
 */
export class CorreoConRegistro extends CorreoPuerto {
  private readonly bitacora = new Logger(CorreoConRegistro.name);

  constructor(
    private readonly correo: CorreoPuerto,
    private readonly registro: RegistroEnviosCorreo,
    private readonly reloj: Reloj,
  ) {
    super();
  }

  async enviar<D extends { enlace: string }>(destinatario: string, plantilla: PlantillaCorreo<D>, datos: D): Promise<void> {
    try {
      await this.correo.enviar(destinatario, plantilla, datos);
      await this.anotar(true, null);
    } catch (error) {
      await this.anotar(false, error instanceof CorreoNoEnviado ? error.causa : String(error));
      throw error;
    }
  }

  private async anotar(entregado: boolean, error: string | null): Promise<void> {
    try {
      await this.registro.registrar({ en: this.reloj.ahora(), entregado, error });
    } catch (falla) {
      this.bitacora.warn(`No se pudo anotar el último envío de correo: ${falla instanceof Error ? falla.message : String(falla)}`);
    }
  }
}
