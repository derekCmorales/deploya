import { MuestraIlegible } from "./errores";
import { muestraDesdeStats, type StatsMotor } from "./muestra-desde-stats";

const MB = 1024 * 1024;

function stats(parcial: Partial<StatsMotor> = {}): StatsMotor {
  return {
    cpu_stats: { cpu_usage: { total_usage: 1_240_000_000 }, system_cpu_usage: 20_000_000_000, online_cpus: 2 },
    precpu_stats: { cpu_usage: { total_usage: 1_000_000_000 }, system_cpu_usage: 16_000_000_000 },
    memory_stats: { usage: 480 * MB, stats: { inactive_file: 50 * MB } },
    ...parcial,
  };
}

describe("muestraDesdeStats", () => {
  it("las stats del Engine API se leen como vCPU y MB, igual que docker stats", () => {
    // Δuso 0.24e9 / Δsistema 4e9 × 2 CPUs = 0.12 vCPU; 480 MB − 50 MB de caché inactiva.
    expect(muestraDesdeStats(stats())).toEqual({ cpu: 0.12, memoriaMb: 430 });
  });

  it("en cgroup v1 descuenta total_inactive_file y cuenta las CPUs por percpu_usage", () => {
    const v1 = stats({
      cpu_stats: { cpu_usage: { total_usage: 3_000_000_000, percpu_usage: [1, 1, 1, 1] }, system_cpu_usage: 24_000_000_000 },
      memory_stats: { usage: 1_600 * MB, stats: { total_inactive_file: 64 * MB } },
    });
    expect(muestraDesdeStats(v1)).toEqual({ cpu: 1, memoriaMb: 1_536 });
  });

  it("sin delta del sistema la CPU es 0", () => {
    const quieto = stats({ precpu_stats: { cpu_usage: { total_usage: 1_240_000_000 }, system_cpu_usage: 20_000_000_000 } });
    expect(muestraDesdeStats(quieto).cpu).toBe(0);
  });

  it("rechaza stats sin CPU o sin memoria", () => {
    expect(() => muestraDesdeStats(stats({ cpu_stats: {} }))).toThrow(MuestraIlegible);
    expect(() => muestraDesdeStats(stats({ memory_stats: {} }))).toThrow(MuestraIlegible);
    expect(() => muestraDesdeStats({})).toThrow(MuestraIlegible);
  });
});
