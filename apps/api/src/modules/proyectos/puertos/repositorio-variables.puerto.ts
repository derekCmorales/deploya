export interface VariablePersistida {
  id: string;
  proyectoId: string;
  clave: string;
  valorCifrado: string;
  creadoEn: Date;
  actualizadoEn: Date;
}

export abstract class RepositorioVariables {
  abstract obtenerPorProyecto(proyectoId: string): Promise<VariablePersistida[]>;
  abstract guardarConjunto(proyectoId: string, variables: { clave: string; valorCifrado: string }[]): Promise<void>;
  abstract eliminarPorProyecto(proyectoId: string): Promise<void>;
}