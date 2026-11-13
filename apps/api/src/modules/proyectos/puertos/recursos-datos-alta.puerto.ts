import type { TipoRecursoAlta } from "../dominio/proyecto";

/** Recursos de datos de la cuenta frente al plan; `maximo` es `Infinity` en autoalojado (`null` en JSON). */
export interface LimiteDatosCuenta {
  usados: number;
  maximo: number;
}

/**
 * Lo único que el alta guiada necesita de los recursos de datos (M5): preguntar si caben en el plan
 * antes de guardar el proyecto y pedirlos después. Lanza `RecursosDatosNoPermitidos` si el plan, la
 * suscripción o un tipo repetido lo impiden.
 */
export abstract class RecursosDatosAlta {
  abstract verificar(usuarioId: string, tipos: readonly TipoRecursoAlta[]): Promise<void>;
  abstract limite(usuarioId: string): Promise<LimiteDatosCuenta>;
  abstract crear(usuarioId: string, proyectoId: string, tipos: readonly TipoRecursoAlta[]): Promise<void>;
}
