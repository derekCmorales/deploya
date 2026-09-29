export abstract class CuotaProyectosPuerto {
  abstract maxProyectosDe(usuarioId: string): Promise<number>;
}