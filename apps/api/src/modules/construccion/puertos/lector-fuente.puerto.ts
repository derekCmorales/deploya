/**
 * Lee archivos del código fuente para la detección de stack (Adapter). En el alta, M3 lo
 * implementa sobre la API pública de GitHub; en el trabajador, `LectorFuenteLocal` lee el clon.
 */
export abstract class LectorFuente {
  abstract existe(ruta: string): Promise<boolean>;
  /** `null` si el archivo no existe. */
  abstract leer(ruta: string): Promise<string | null>;
}
