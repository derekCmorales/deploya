import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MuestraIlegible } from "../../modules/orquestacion/metricas/dominio/errores";
import { MetricasDockerStats } from "./metricas-docker-stats";

describe("MetricasDockerStats", () => {
  it("invoca docker stats --no-stream --format json y traduce la salida", async () => {
    const directorio = await mkdtemp(join(tmpdir(), "stats-"));
    const ejecutable = join(directorio, "docker");
    const script = [
      "#!/bin/sh",
      'test "$1" = "stats" && test "$2" = "--no-stream" && test "$3" = "--format" && test "$4" = "json" || exit 2',
      "printf '%s\\n' '{\"CPUPerc\":\"12.00%\",\"MemUsage\":\"430MiB / 512MiB\"}'",
    ].join("\n");
    await writeFile(ejecutable, script, { mode: 0o755 });
    await chmod(ejecutable, 0o755);
    try {
      const adaptador = new MetricasDockerStats(ejecutable);
      await expect(adaptador.muestra("abc123")).resolves.toEqual({ cpu: 0.12, memoriaMb: 430 });
    } finally {
      await rm(directorio, { recursive: true, force: true });
    }
  });

  it("si docker stats falla, la muestra es ilegible", async () => {
    const directorio = await mkdtemp(join(tmpdir(), "stats-"));
    const ejecutable = join(directorio, "docker");
    await writeFile(ejecutable, "#!/bin/sh\necho caido >&2\nexit 1\n", { mode: 0o755 });
    try {
      await expect(new MetricasDockerStats(ejecutable).muestra("abc")).rejects.toBeInstanceOf(MuestraIlegible);
      await expect(new MetricasDockerStats(ejecutable).muestra("-mal")).rejects.toBeInstanceOf(MuestraIlegible);
    } finally {
      await rm(directorio, { recursive: true, force: true });
    }
  });
});
