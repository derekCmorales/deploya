export interface VariableGuardada {
  clave: string;
  valorCifrado: string;
  actualizado: Date;
}

export interface VariableNueva {
  clave: string;
  valorCifrado: string;
}

/** Conjunto de variables de un proyecto. `reemplazar` es transaccional. */
export abstract class RepositorioVariables {
  abstract deProyecto(proyectoId: string): Promise<VariableGuardada[]>;
  abstract reemplazar(proyectoId: string, variables: VariableNueva[]): Promise<VariableGuardada[]>;
}
