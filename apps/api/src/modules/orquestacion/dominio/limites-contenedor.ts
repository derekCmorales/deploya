const NANO_CPUS_POR_CPU = 1_000_000_000;
const BYTES_POR_MB = 1024 * 1024;

/** Objeto valor: los límites que ve Docker (`NanoCpus`, `Memory`) a partir del plan. */
export interface LimitesContenedor {
  nanoCpus: number;
  memoriaBytes: number;
}

export function limitesDesde(recursos: { cpus: number; memoriaMb: number }): LimitesContenedor {
  return {
    nanoCpus: Math.round(recursos.cpus * NANO_CPUS_POR_CPU),
    memoriaBytes: recursos.memoriaMb * BYTES_POR_MB,
  };
}
