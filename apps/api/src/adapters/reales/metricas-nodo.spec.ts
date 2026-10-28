import type { CpuInfo } from "node:os";
import { MetricasNodoSistema, type FuenteSistema } from "./metricas-nodo";

const MB = 1024 * 1024;
const GB = 1024 * MB;

function nucleo(idle: number, user: number): CpuInfo {
  return { model: "vCPU", speed: 2400, times: { user, nice: 0, sys: 0, idle, irq: 0 } };
}

function fuente(lecturas: CpuInfo[][]): FuenteSistema & { rutas: string[] } {
  const rutas: string[] = [];
  return {
    rutas,
    cpus: () => lecturas.shift() ?? [],
    memoria: () => ({ totalBytes: 4096 * MB, libreBytes: 1434 * MB }),
    disco: async (ruta) => {
      rutas.push(ruta);
      return { blocks: 80 * 1024, bsize: GB / 1024, bavail: 49 * 1024 };
    },
  };
}

describe("MetricasNodoSistema (SP-13)", () => {
  it("la CPU es la fracción ocupada entre dos lecturas, en vCPU", async () => {
    const sistema = fuente([
      [nucleo(1000, 1000), nucleo(1000, 1000)],
      [nucleo(1038, 1062), nucleo(1038, 1062)],
    ]);
    const nodo = new MetricasNodoSistema("/", sistema);

    await nodo.nodo();
    const uso = await nodo.nodo();

    expect(uso.cpu).toEqual({ usado: 1.24, total: 2 });
    expect(uso.memoriaMb).toEqual({ usado: 2662, total: 4096 });
    expect(uso.discoGb).toEqual({ usado: 31, total: 80 });
    expect(sistema.rutas).toEqual(["/", "/"]);
  });

  it("la primera lectura usa el promedio desde el arranque y no divide entre cero", async () => {
    expect((await new MetricasNodoSistema("/", fuente([[nucleo(3, 1)]])).nodo()).cpu).toEqual({ usado: 0.25, total: 1 });
    expect((await new MetricasNodoSistema("/", fuente([[]])).nodo()).cpu).toEqual({ usado: 0, total: 0 });
  });
});
