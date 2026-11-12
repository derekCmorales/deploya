import type { EstadoRecursoDatos, NuevoRecursoDatos, RecursoDatos } from "../dominio/recurso-datos";

/**
 * Persistencia de recursos de datos (Repository): Prisma en compose, memoria en pruebas. La API y el
 * trabajador comparten la base, así el trabajador ve lo que la API pidió crear.
 */
export abstract class RepositorioRecursosDatos {
  /** Estado `creando`. Lanza `TipoYaConectado` si el dueño ya tiene uno de ese tipo. */
  abstract crear(nuevo: NuevoRecursoDatos): Promise<RecursoDatos>;
  abstract porId(id: string): Promise<RecursoDatos | null>;
  /** Propios y compartidos con el proyecto. */
  abstract conectadosA(proyectoId: string): Promise<RecursoDatos[]>;
  /** Los que son de alguno de estos proyectos (para contar el tope de la cuenta y suspenderla). */
  abstract deDuenos(proyectoIds: readonly string[]): Promise<RecursoDatos[]>;
  /** Los que están `disponible`, para medir su disco. */
  abstract disponibles(): Promise<RecursoDatos[]>;
  /** Idempotente. */
  abstract compartir(recursoId: string, proyectoId: string): Promise<void>;
  abstract dejarDeCompartir(recursoId: string, proyectoId: string): Promise<void>;
  abstract cambiarEstado(id: string, estado: EstadoRecursoDatos, detalle?: string | null): Promise<void>;
  abstract registrarUso(id: string, usoDiscoMb: number, medidoEn: Date): Promise<void>;
  /** Borra la fila y sus filas de compartido; no toca Docker. */
  abstract eliminar(id: string): Promise<void>;
}
