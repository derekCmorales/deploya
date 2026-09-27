import type Docker from "dockerode";
import { pack } from "tar-fs";
import { ConstruccionFallida, TiempoConstruccionAgotado } from "../../modules/construccion/dominio/errores";
import {
  ConstructorImagenPuerto,
  type ImagenConstruida,
  type SolicitudConstruccion,
} from "../../modules/construccion/puertos/constructor-imagen.puerto";

interface EventoConstruccion {
  stream?: string;
  error?: string;
  errorDetail?: { code?: number; message?: string };
}

/** Código cuando Docker no informa uno (p. ej. error antes de ejecutar un `RUN`). */
const CODIGO_DESCONOCIDO = 1;

export type Empaquetar = (directorio: string) => NodeJS.ReadableStream;

/** `docker build` vía dockerode: empaqueta el clon, sigue el flujo y lee digest y tamaño. */
export class ConstructorDocker extends ConstructorImagenPuerto {
  constructor(
    private readonly docker: Docker,
    private readonly empaquetar: Empaquetar = pack,
  ) {
    super();
  }

  async construir(solicitud: SolicitudConstruccion, alLinea: (texto: string) => void): Promise<ImagenConstruida> {
    const cancelacion = new AbortController();
    const temporizador = setTimeout(() => cancelacion.abort(), solicitud.tiempoMaximoMs);
    let errorDeLectura: Error | null = null;
    const contexto = this.empaquetar(solicitud.directorio);
    // Sin este manejador, un error de lectura del clon tumbaría el proceso del worker.
    contexto.once("error", (error: Error) => {
      errorDeLectura = error;
      cancelacion.abort();
    });
    try {
      const flujo = await this.docker.buildImage(contexto, {
        t: solicitud.etiqueta,
        dockerfile: solicitud.rutaDockerfile,
        rm: true,
        forcerm: true,
        abortSignal: cancelacion.signal,
      });
      await this.seguir(flujo, alLinea);
      const imagen = await this.docker.getImage(solicitud.etiqueta).inspect();
      return { digest: imagen.Id, tamanoBytes: imagen.Size };
    } catch (error) {
      if (errorDeLectura) throw new ConstruccionFallida(CODIGO_DESCONOCIDO, `no se pudo leer el código: ${(errorDeLectura as Error).message}`);
      if (cancelacion.signal.aborted) throw new TiempoConstruccionAgotado();
      throw error;
    } finally {
      clearTimeout(temporizador);
    }
  }

  private seguir(flujo: NodeJS.ReadableStream, alLinea: (texto: string) => void): Promise<void> {
    return new Promise((resolver, rechazar) => {
      let fallo: ConstruccionFallida | null = null;
      this.docker.modem.followProgress(
        flujo,
        (error: Error | null) => (error ? rechazar(error) : fallo ? rechazar(fallo) : resolver()),
        (evento: EventoConstruccion) => {
          if (evento.stream) evento.stream.split("\n").filter((l) => l.trim()).forEach(alLinea);
          if (evento.error) {
            alLinea(evento.error);
            fallo = new ConstruccionFallida(evento.errorDetail?.code ?? CODIGO_DESCONOCIDO, evento.error);
          }
        },
      );
    });
  }
}
