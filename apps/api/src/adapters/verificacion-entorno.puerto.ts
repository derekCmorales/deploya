/** Puerto DIP — healthcheck del entorno. Sin prefijo I. */
export abstract class VerificacionEntornoPuerto {
  abstract saludable(contenedorId: string): Promise<boolean>;
}
