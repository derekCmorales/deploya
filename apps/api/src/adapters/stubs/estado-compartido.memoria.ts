import { ReporteServidorPuerto, type ReporteServidor } from "../../modules/administracion/instalacion/puertos/reporte-servidor.puerto";
import { RegistroEnviosCorreo, type EnvioCorreo } from "../../modules/notificaciones/puertos/registro-envios.puerto";

/** Sin Redis (stub y pruebas): el último envío vive en el proceso. */
export class RegistroEnviosMemoria extends RegistroEnviosCorreo {
  private envio: EnvioCorreo | null = null;

  async registrar(envio: EnvioCorreo): Promise<void> {
    this.envio = envio;
  }

  async ultimo(): Promise<EnvioCorreo | null> {
    return this.envio;
  }
}

/** Sin Redis (stub y pruebas): el último reporte vive en el proceso. */
export class ReporteServidorMemoria extends ReporteServidorPuerto {
  private reporte: ReporteServidor | null = null;

  async publicar(reporte: ReporteServidor): Promise<void> {
    this.reporte = reporte;
  }

  async ultimo(): Promise<ReporteServidor | null> {
    return this.reporte;
  }
}
