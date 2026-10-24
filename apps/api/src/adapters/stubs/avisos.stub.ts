import { AvisosPuerto, type AvisoDespliegue, type AvisoSuscripcion } from "../../modules/notificaciones";

/** Avisos falsos: guardan lo que llega, o lanzan el error configurado (un SMTP caído detrás del puerto). */
export class AvisosStub extends AvisosPuerto {
  readonly despliegues: AvisoDespliegue[] = [];
  readonly suscripciones: AvisoSuscripcion[] = [];
  error: Error | null = null;

  async despliegueTerminado(aviso: AvisoDespliegue): Promise<void> {
    if (this.error) throw this.error;
    this.despliegues.push(aviso);
  }

  async suscripcionCambio(aviso: AvisoSuscripcion): Promise<void> {
    if (this.error) throw this.error;
    this.suscripciones.push(aviso);
  }
}
