export interface ObjetivoSalud {
  host: string;
  puerto: number;
  ruta: string;
  tiempoMaximoMs: number;
}

export interface ResultadoSalud {
  ok: boolean;
  estadoHttp: number | null;
  milisegundos: number;
  detalle: string;
}

/** Puerto DIP — salud HTTP del contenedor; reintenta hasta `tiempoMaximoMs`. Sin prefijo I. */
export abstract class VerificacionEntornoPuerto {
  abstract saludable(objetivo: ObjetivoSalud): Promise<ResultadoSalud>;
}
