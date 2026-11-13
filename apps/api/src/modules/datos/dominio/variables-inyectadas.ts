import type { VariablesRecurso } from "./tipo-recurso-datos";

/** Lo que un despliegue recibe de sus recursos conectados (recursos-datos.md § Tipos). */
export interface InyeccionDatos {
  /** Nombres legibles de los recursos («PostgreSQL 17 + pgvector»), para la bitácora. */
  recursos: string[];
  variables: VariablesRecurso;
  /** Los que seguían en `creando` al tope de la espera (feat/m3-alta-guiada), para avisar en la bitácora. */
  pendientes?: string[];
}

/** Junta las variables de varios recursos; un proyecto tiene a lo sumo uno por tipo, así que no chocan. */
export function juntarVariables(partes: readonly VariablesRecurso[]): VariablesRecurso {
  return partes.reduce<VariablesRecurso>(
    (total, parte) => ({ base: { ...total.base, ...parte.base }, prefijadas: { ...total.prefijadas, ...parte.prefijadas } }),
    { base: {}, prefijadas: {} },
  );
}
