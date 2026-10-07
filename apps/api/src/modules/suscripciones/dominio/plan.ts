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
  orden: number;
  activo: boolean;
}

/** Lo que el catálogo público (pantalla 06) muestra de cada plan. */
export type PlanCatalogo = Omit<Plan, "id" | "orden" | "activo">;
