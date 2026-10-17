import { INTERVALO_VIGIA_MS } from "../dominio/motor.constantes";
import { CancelacionesPuerto } from "../puertos/cancelaciones.puerto";

/**
 * Observer por consulta (M4-02): mientras corre un despliegue pregunta a `CancelacionesPuerto`
 * y, si el cliente pidió cancelar, aborta el `AbortController` del despliegue. Los pasos solo
 * conocen la señal; el pipeline no sabe de Redis. Con `intervaloMs = 0` no hay temporizador y
 * las pruebas llaman a `revisar` a mano.
 */
export class VigiaCancelacion {
  constructor(
    private readonly cancelaciones: CancelacionesPuerto,
    private readonly intervaloMs: number = INTERVALO_VIGIA_MS,
  ) {}

  /** Devuelve la función que detiene la vigilancia. */
  vigilar(despliegueId: string, controlador: AbortController): () => void {
    if (this.intervaloMs <= 0) return () => undefined;
    const temporizador = setInterval(() => void this.revisar(despliegueId, controlador), this.intervaloMs);
    temporizador.unref();
    return () => clearInterval(temporizador);
  }

  async revisar(despliegueId: string, controlador: AbortController): Promise<void> {
    if (controlador.signal.aborted) return;
    if (await this.cancelaciones.pedida(despliegueId)) controlador.abort();
  }
}
