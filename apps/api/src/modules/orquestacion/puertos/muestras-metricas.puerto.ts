/** Lo que se persiste: una fila por despliegue y minuto. */
export interface NuevaMuestra {
  despliegueId: string;
  tomada: Date;
  cpu: number;
  memoriaMb: number;
}

/**
 * Lectura de la ventana. `version` es el `numero` del despliegue: hace falta para
 * `promedioPorVersion` y sale del join, no de una segunda consulta.
 */
export interface Muestra extends NuevaMuestra {
  version: number;
}

/** Prisma y memoria cumplen el mismo contrato (L). */
export abstract class MuestrasMetricas {
  abstract guardar(muestra: NuevaMuestra): Promise<void>;
  abstract deProyecto(proyectoId: string, desde: Date): Promise<Muestra[]>;
  abstract purgarAntesDe(fecha: Date): Promise<number>;
}
