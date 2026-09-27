export interface SolicitudConstruccion {
  directorio: string;
  rutaDockerfile: string;
  etiqueta: string;
  tiempoMaximoMs: number;
}

export interface ImagenConstruida {
  digest: string;
  tamanoBytes: number;
}

/**
 * `docker build` detrás de un puerto (cierra B6). Cada línea de salida va a `alLinea`.
 * Lanza `ConstruccionFallida` (con código de salida) o `TiempoConstruccionAgotado`.
 */
export abstract class ConstructorImagenPuerto {
  abstract construir(solicitud: SolicitudConstruccion, alLinea: (texto: string) => void): Promise<ImagenConstruida>;
}
