/** El resultado del último envío de correo: lo lee Estado de Admin · Instalación (SP-18). */
export interface EnvioCorreo {
  en: Date;
  entregado: boolean;
  /** Lo que respondió el servidor SMTP si falló: «535 usuario rechazado». */
  error: string | null;
}

/** Compartido entre la API y el trabajador (Redis en compose, memoria en pruebas). */
export abstract class RegistroEnviosCorreo {
  abstract registrar(envio: EnvioCorreo): Promise<void>;
  abstract ultimo(): Promise<EnvioCorreo | null>;
}
