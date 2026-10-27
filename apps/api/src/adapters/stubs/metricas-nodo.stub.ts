import { MetricasNodoPuerto, type UsoNodo } from "../../modules/administracion/infraestructura/puertos/metricas-nodo.puerto";

/** Un VPS de ejemplo (2 vCPU, 4 GB, 80 GB), con la misma forma que el real (LSP). */
export class MetricasNodoStub extends MetricasNodoPuerto {
  uso: UsoNodo = {
    cpu: { usado: 1.24, total: 2 },
    memoriaMb: { usado: 2662, total: 4096 },
    discoGb: { usado: 31, total: 80 },
  };

  async nodo(): Promise<UsoNodo> {
    return this.uso;
  }
}
