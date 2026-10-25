/**
 * Lo que el trabajador (único proceso con docker.sock, ADR 0002) mide del servidor cada 10 min
 * para Admin · Instalación: la API no llama a Docker.
 */
export interface ReporteServidor {
  tomado: Date;
  docker: { version: string; contenedores: number } | null;
  /** Si Docker no respondió, el error. */
  errorDocker: string | null;
  disco: { usadoGb: number; totalGb: number };
  memoria: { libreMb: number; totalMb: number };
}

/** Dónde se deja y se lee el último reporte (Redis en compose, memoria en pruebas). */
export abstract class ReporteServidorPuerto {
  abstract publicar(reporte: ReporteServidor): Promise<void>;
  abstract ultimo(): Promise<ReporteServidor | null>;
}

/** Solo en el trabajador: medir el servidor. */
export abstract class LecturaServidorPuerto {
  abstract medir(): Promise<Omit<ReporteServidor, "tomado">>;
}
