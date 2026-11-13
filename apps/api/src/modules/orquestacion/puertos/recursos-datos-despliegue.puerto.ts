/** Lo que los recursos de datos conectados aportan al contenedor de la app (recursos-datos.md). */
export interface InyeccionDespliegue {
  /** Nombres legibles para la bitácora; nunca valores. */
  recursos: string[];
  variables: {
    /** Las del usuario ganan sobre estas (`DATABASE_URL`, `REDIS_URL`, `S3_*`…). */
    base: Record<string, string>;
    /** `DEPLOYA_*`: siempre se inyectan y no se pisan. */
    prefijadas: Record<string, string>;
  };
  /** Recursos que seguían creándose al tope de la espera; se inyectaron igual. */
  pendientes?: string[];
}

/**
 * Lo que M5 ve de los recursos de datos en el trabajador: conectarlos y leer sus variables al
 * desplegar, y limpiar al eliminar el proyecto. El adaptador envuelve `MotorDatosService`.
 */
export abstract class RecursosDatosDespliegue {
  abstract paraDespliegue(proyecto: { id: string; subdominio: string }): Promise<InyeccionDespliegue>;
  abstract liberarProyecto(subdominio: string): Promise<void>;
}
