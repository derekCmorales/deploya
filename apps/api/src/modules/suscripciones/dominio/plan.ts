export interface Plan {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precio30: number;
  precio365: number | null;
  maxProyectos: number;
  cpus: number;
  memoriaMb: number;
  construccionesMes: number;
  /** Bases administradas por cuenta (feat/m5-recursos-datos). */
  maxRecursosDatos: number;
  /** Disco por recurso de datos: se mide y se avisa, no corta. */
  discoDatosMb: number;
  orden: number;
  activo: boolean;
}

/** Lo que el catálogo público (pantalla 06) muestra de cada plan. */
export type PlanCatalogo = Omit<Plan, "id" | "orden" | "activo">;
