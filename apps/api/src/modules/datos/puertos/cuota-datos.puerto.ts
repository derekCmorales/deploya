import type { EstadoSuscripcionDatos } from "../dominio/politica-recursos-datos";

/** Lo que M2 dice de la cuenta para sus recursos de datos (subconjunto de `cuotaDe`). */
export interface CuotaDatos {
  estado: EstadoSuscripcionDatos;
  /** `Infinity` en autoalojado: sin tope. */
  maxRecursosDatos: number;
  discoDatosMb: number;
}

/** Puerto estrecho sobre `SuscripcionesService.cuotaDe` (M2). */
export abstract class CuotaDatosPuerto {
  abstract deUsuario(usuarioId: string): Promise<CuotaDatos>;
}
