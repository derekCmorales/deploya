import type Docker from "dockerode";
import { MuestraIlegible } from "../../modules/orquestacion/metricas/dominio/errores";
import { MetricasDockerStats } from "./metricas-docker-stats";

const MB = 1024 * 1024;
const STATS = {
  cpu_stats: { cpu_usage: { total_usage: 1_240_000_000 }, system_cpu_usage: 20_000_000_000, online_cpus: 2 },
  precpu_stats: { cpu_usage: { total_usage: 1_000_000_000 }, system_cpu_usage: 16_000_000_000 },
  memory_stats: { usage: 430 * MB, stats: {} },
};

function motor(stats: jest.Mock): { docker: Docker; getContainer: jest.Mock } {
  const getContainer = jest.fn(() => ({ stats }));
  return { docker: { getContainer } as unknown as Docker, getContainer };
}

describe("MetricasDockerStats", () => {
  it("pide las stats sin stream por el socket y las traduce", async () => {
    const stats = jest.fn().mockResolvedValue(STATS);
    const { docker, getContainer } = motor(stats);

    await expect(new MetricasDockerStats(docker).muestra("abc123")).resolves.toEqual({ cpu: 0.12, memoriaMb: 430 });

    expect(getContainer).toHaveBeenCalledWith("abc123");
    expect(stats).toHaveBeenCalledWith({ stream: false });
  });

  it("si el motor falla, la muestra es ilegible", async () => {
    const { docker } = motor(jest.fn().mockRejectedValue(new Error("no such container")));

    await expect(new MetricasDockerStats(docker).muestra("abc")).rejects.toBeInstanceOf(MuestraIlegible);
  });

  it("un id inválido no llega al motor", async () => {
    const { docker, getContainer } = motor(jest.fn());

    await expect(new MetricasDockerStats(docker).muestra("-mal")).rejects.toBeInstanceOf(MuestraIlegible);
    expect(getContainer).not.toHaveBeenCalled();
  });

  it("si el motor no responde a tiempo, la muestra es ilegible", async () => {
    const { docker } = motor(jest.fn(() => new Promise(() => undefined)));

    await expect(new MetricasDockerStats(docker, 5).muestra("abc")).rejects.toThrow("no respondió a tiempo");
  });
});
