import { DECIMALES_CPU } from "../metricas.constantes";

export function redondearCpu(valor: number): number {
  const factor = 10 ** DECIMALES_CPU;
  return Math.round(valor * factor) / factor;
}
