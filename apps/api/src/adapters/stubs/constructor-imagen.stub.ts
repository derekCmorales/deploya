import { Injectable } from "@nestjs/common";
import { DespliegueCancelado } from "../../modules/construccion/dominio/errores";
import {
  ConstructorImagenPuerto,
  type ImagenConstruida,
  type SolicitudConstruccion,
} from "../../modules/construccion/puertos/constructor-imagen.puerto";

/** Construcción falsa: emite líneas y devuelve una imagen, o lanza el error configurado. */
@Injectable()
export class ConstructorImagenStub extends ConstructorImagenPuerto {
  lineas = ["Step 1/2 : FROM node:22-alpine", "Successfully built 9f2c4e7a"];
  imagen: ImagenConstruida = { digest: "sha256:9f2c4e7a0000000000000000000000000000000000000000000000000000e41a", tamanoBytes: 48_000_000 };
  error: Error | null = null;
  /** Si es `true`, el build queda colgado hasta que se aborte la señal (simula un `docker build` largo). */
  colgado = false;
  readonly solicitudes: SolicitudConstruccion[] = [];

  async construir(solicitud: SolicitudConstruccion, alLinea: (texto: string) => void, senal?: AbortSignal): Promise<ImagenConstruida> {
    this.solicitudes.push(solicitud);
    this.lineas.forEach(alLinea);
    if (this.colgado) await this.esperarAborto(senal);
    if (senal?.aborted) throw new DespliegueCancelado();
    if (this.error) throw this.error;
    return this.imagen;
  }

  private esperarAborto(senal?: AbortSignal): Promise<void> {
    return new Promise((resolver) => {
      if (!senal || senal.aborted) return resolver();
      senal.addEventListener("abort", () => resolver(), { once: true });
    });
  }
}
