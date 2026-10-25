export type EstadoComprobacion = "ok" | "aviso" | "error";

/** Una fila de Estado en la 32: «Docker · 27.3 · 6 contenedores de deploya en marcha». */
export interface ResultadoComprobacion {
  id: string;
  estado: EstadoComprobacion;
  detalle: string;
}

/** Componente del Composite: cada comprobación es una clase independiente. */
export abstract class ComprobacionInstalacion {
  abstract readonly id: string;
  abstract comprobar(): Promise<ResultadoComprobacion>;
}

/**
 * Composite (SP-18): corre todas las comprobaciones a la vez. Una que lanza no tumba a las demás:
 * se muestra como error con su mensaje. Agregar una comprobación es una clase nueva.
 */
export class SaludInstalacion {
  constructor(private readonly comprobaciones: readonly ComprobacionInstalacion[]) {}

  comprobar(): Promise<ResultadoComprobacion[]> {
    return Promise.all(this.comprobaciones.map((c) => this.una(c)));
  }

  private async una(comprobacion: ComprobacionInstalacion): Promise<ResultadoComprobacion> {
    try {
      return await comprobacion.comprobar();
    } catch (error) {
      return { id: comprobacion.id, estado: "error", detalle: error instanceof Error ? error.message : String(error) };
    }
  }
}
