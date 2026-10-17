/**
 * Señal API → trabajador para cortar un despliegue en curso. La API pide; el trabajador
 * pregunta cada `INTERVALO_VIGIA_MS`. Redis en compose, memoria en pruebas.
 */
export abstract class CancelacionesPuerto {
  abstract pedir(despliegueId: string): Promise<void>;
  abstract pedida(despliegueId: string): Promise<boolean>;
}
