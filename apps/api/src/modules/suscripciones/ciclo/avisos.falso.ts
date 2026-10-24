import { AvisosPuerto, type AvisoDespliegue, type AvisoSuscripcion } from "../../notificaciones";

/** Doble de `AvisosPuerto` (M10) para las pruebas del ciclo: anota cada aviso de suscripción. */
export class AvisosFalso extends AvisosPuerto {
  readonly suscripciones: AvisoSuscripcion[] = [];
  private fallo: Error | null = null;

  fallarCon(error: Error): this {
    this.fallo = error;
    return this;
  }

  async despliegueTerminado(_aviso: AvisoDespliegue): Promise<void> {}

  async suscripcionCambio(aviso: AvisoSuscripcion): Promise<void> {
    if (this.fallo) throw this.fallo;
    this.suscripciones.push(aviso);
  }
}
