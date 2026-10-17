import type { EstadoDespliegue } from "../dominio/estados";

/** Hecho que el pipeline anuncia cuando un despliegue deja de estar en curso (Observer). */
export interface DespliegueTerminado {
  proyectoId: string;
  despliegueId: string;
  estado: EstadoDespliegue;
}

/** Quien reacciona a un despliegue terminado (p. ej. la retención de artefactos de M5). */
export abstract class OyenteDespliegue {
  abstract alTerminar(evento: DespliegueTerminado): Promise<void>;
}

/** Token de Nest con los oyentes registrados en el trabajador. */
export const OYENTES_DESPLIEGUE = Symbol("OYENTES_DESPLIEGUE");
