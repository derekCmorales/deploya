import type { InyeccionDespliegue } from "../puertos/recursos-datos-despliegue.puerto";

export interface VariablesFusionadas {
  variables: Record<string, string>;
  /** Cuántas puso Deploya (una del usuario que pisó una inyectada no cuenta). */
  inyectadas: number;
}

/**
 * Las variables del usuario ganan sobre las inyectadas de nombre corto (`DATABASE_URL`); las
 * `DEPLOYA_*` siempre se inyectan y no se pisan (recursos-datos.md).
 */
export function fusionarVariables(usuario: Readonly<Record<string, string>>, datos: InyeccionDespliegue["variables"]): VariablesFusionadas {
  const baseLibre = Object.fromEntries(Object.entries(datos.base).filter(([clave]) => !(clave in usuario)));
  return {
    variables: { ...baseLibre, ...usuario, ...datos.prefijadas },
    inyectadas: Object.keys(baseLibre).length + Object.keys(datos.prefijadas).length,
  };
}

/** «Recursos de datos conectados: PostgreSQL 17 + pgvector, Redis 7 · 7 variables inyectadas» (sin valores). */
export function textoInyeccion(recursos: readonly string[], inyectadas: number): string {
  const variables = inyectadas === 1 ? "1 variable inyectada" : `${inyectadas} variables inyectadas`;
  return `Recursos de datos conectados: ${recursos.join(", ")} · ${variables}`;
}
