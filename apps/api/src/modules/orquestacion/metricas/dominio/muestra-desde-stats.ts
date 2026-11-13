import type { MuestraContenedor } from "../../puertos/metricas-contenedor.puerto";
import { redondearCpu } from "./cpu";
import { MuestraIlegible } from "./errores";

const BYTES_POR_MB = 1024 * 1024;

interface UsoCpu {
  cpu_usage?: { total_usage?: number; percpu_usage?: number[] };
  system_cpu_usage?: number;
  online_cpus?: number;
}

/** Lo que este traductor lee de `GET /containers/{id}/stats?stream=false` del Engine API. */
export interface StatsMotor {
  cpu_stats?: UsoCpu;
  precpu_stats?: UsoCpu;
  memory_stats?: { usage?: number; stats?: Record<string, number | undefined> };
}

/**
 * Traduce las stats del Engine API al contrato `{ cpu, memoriaMb }` con las mismas cuentas
 * que `docker stats`: CPU = Δuso / Δsistema × CPUs en línea (en vCPU) y memoria = uso menos la
 * caché inactiva (`inactive_file` en cgroup v2, `total_inactive_file` en v1).
 */
export function muestraDesdeStats(stats: StatsMotor): MuestraContenedor {
  return { cpu: cpuDesde(stats), memoriaMb: memoriaDesde(stats) };
}

function cpuDesde(stats: StatsMotor): number {
  const actual = stats.cpu_stats;
  const total = actual?.cpu_usage?.total_usage;
  const sistema = actual?.system_cpu_usage;
  if (total === undefined || sistema === undefined) throw new MuestraIlegible("stats sin uso de CPU");
  const deltaUso = total - (stats.precpu_stats?.cpu_usage?.total_usage ?? 0);
  const deltaSistema = sistema - (stats.precpu_stats?.system_cpu_usage ?? 0);
  if (deltaSistema <= 0 || deltaUso < 0) return 0;
  const cpus = actual?.online_cpus || actual?.cpu_usage?.percpu_usage?.length || 1;
  return redondearCpu((deltaUso / deltaSistema) * cpus);
}

function memoriaDesde(stats: StatsMotor): number {
  const uso = stats.memory_stats?.usage;
  if (uso === undefined) throw new MuestraIlegible("stats sin uso de memoria");
  const detalle = stats.memory_stats?.stats ?? {};
  const inactiva = detalle.inactive_file ?? detalle.total_inactive_file ?? 0;
  const enUso = inactiva < uso ? uso - inactiva : uso;
  return Math.round(enUso / BYTES_POR_MB);
}
