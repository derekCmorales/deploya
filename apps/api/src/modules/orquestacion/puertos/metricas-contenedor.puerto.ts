/** CPU en vCPU y memoria en MB de un contenedor en un instante. */
export interface MuestraContenedor {
  cpu: number;
  memoriaMb: number;
}

/**
 * Puerto estrecho para medir un contenedor (I). No orquesta: `ContenedorPuerto` sigue
 * creando y deteniendo. El adaptador real es `MetricasDockerStats`.
 */
export abstract class MetricasContenedorPuerto {
  abstract muestra(contenedorId: string): Promise<MuestraContenedor>;
}
