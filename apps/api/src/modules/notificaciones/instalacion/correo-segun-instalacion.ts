import { Logger } from "@nestjs/common";
import type { CifradorVariables } from "../../proyectos/puertos/cifrador-variables.puerto";
import type { CorreoInstalacion, SmtpInstalacion } from "../../suscripciones/modo/configuracion-instalacion";
import type { RepositorioConfiguracionInstalacion } from "../../suscripciones/modo/repositorio-configuracion-instalacion.puerto";
import { CorreoNoEnviado } from "../dominio/errores";
import type { PlantillaCorreo } from "../dominio/plantilla-correo";
import { CorreoPuerto } from "../puertos/correo.puerto";
import type { FabricaCorreoSmtp } from "./correo-smtp-de";

type TipoCorreo = CorreoInstalacion["tipo"];

/**
 * Proxy + Strategy de `CorreoPuerto` en autoalojado (SP-17, contrato instalacion.md § Correo): lee
 * cómo manda correos la instalación en **cada** envío, así un SMTP guardado en 31 o 32 aplica sin
 * reiniciar. `smtp` descifra la clave solo para ese envío; `sin-correo` no manda y no falla;
 * `entorno` delega en el adaptador de las `SMTP_*`, como en la nube.
 */
export class CorreoSegunInstalacion extends CorreoPuerto {
  private readonly bitacora = new Logger(CorreoSegunInstalacion.name);
  private readonly salidas: { [T in TipoCorreo]: (correo: Extract<CorreoInstalacion, { tipo: T }>) => CorreoPuerto | null } = {
    entorno: () => this.entorno,
    "sin-correo": () => null,
    smtp: ({ smtp }) => this.fabricar(this.enClaro(smtp)),
  };

  constructor(
    private readonly configuracion: RepositorioConfiguracionInstalacion,
    private readonly cifrador: CifradorVariables,
    private readonly entorno: CorreoPuerto,
    private readonly fabricar: FabricaCorreoSmtp,
  ) {
    super();
  }

  async enviar<D extends { enlace: string }>(destinatario: string, plantilla: PlantillaCorreo<D>, datos: D): Promise<void> {
    const salida = await this.salidaPara(destinatario);
    if (!salida) {
      this.bitacora.log(`Sin correo por ahora: no se envió «${plantilla.componer(datos).asunto}» a ${destinatario}.`);
      return;
    }
    await salida.enviar(destinatario, plantilla, datos);
  }

  /** Leer la configuración o descifrar la clave puede fallar: quien envía recibe el mismo `CorreoNoEnviado` de siempre. */
  private async salidaPara(destinatario: string): Promise<CorreoPuerto | null> {
    try {
      const correo = await this.configuracion.correo();
      return (this.salidas[correo.tipo] as (c: CorreoInstalacion) => CorreoPuerto | null)(correo);
    } catch (error) {
      throw new CorreoNoEnviado(destinatario, `No se pudo leer el correo de la instalación: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private enClaro(smtp: SmtpInstalacion) {
    return { host: smtp.host, puerto: smtp.puerto, usuario: smtp.usuario, contrasena: this.cifrador.descifrar(smtp.claveCifrada), remitente: smtp.remitente };
  }
}
