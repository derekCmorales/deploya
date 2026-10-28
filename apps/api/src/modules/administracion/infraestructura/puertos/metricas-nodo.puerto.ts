export interface Uso {
  usado: number;
  total: number;
}

/** CPU en vCPU, memoria en MB y disco en GB del servidor (un solo nodo). */
export interface UsoNodo {
  cpu: Uso;
  memoriaMb: Uso;
  discoGb: Uso;
}

/** Leer el nodo detrás de un puerto (SP-13): `/proc` y el sistema de archivos, sin docker.sock. */
export abstract class MetricasNodoPuerto {
  abstract nodo(): Promise<UsoNodo>;
}
