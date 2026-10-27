import { statfs } from "node:fs/promises";
import { cpus, freemem, totalmem, type CpuInfo } from "node:os";
import { MetricasNodoPuerto, type UsoNodo } from "../../modules/administracion/infraestructura/puertos/metricas-nodo.puerto";

const BYTES_POR_MB = 1024 * 1024;
const BYTES_POR_GB = 1024 * BYTES_POR_MB;
const DECIMALES = 100;

/** Lo que el adaptador lee del sistema; inyectable para probarlo sin depender de la máquina. */
export interface FuenteSistema {
  cpus(): CpuInfo[];
  memoria(): { totalBytes: number; libreBytes: number };
  disco(ruta: string): Promise<{ blocks: number; bsize: number; bavail: number }>;
}

export const SISTEMA_NODE: FuenteSistema = {
  cpus,
  memoria: () => ({ totalBytes: totalmem(), libreBytes: freemem() }),
  disco: (ruta) => statfs(ruta),
};

interface Tiempos {
  ocioso: number;
  total: number;
}

const redondear = (valor: number) => Math.round(valor * DECIMALES) / DECIMALES;

function tiemposDe(nucleos: CpuInfo[]): Tiempos {
  return nucleos.reduce(
    (suma, { times }) => ({
      ocioso: suma.ocioso + times.idle,
      total: suma.total + times.user + times.nice + times.sys + times.idle + times.irq,
    }),
    { ocioso: 0, total: 0 },
  );
}

/**
 * CPU, memoria y disco del nodo (SP-13). `/proc` dentro del contenedor de la API ve el host, así
 * que no hace falta docker.sock ni privilegios. La CPU es la fracción ocupada entre dos lecturas
 * (la pantalla consulta cada 5 s); la primera vez, el promedio desde el arranque.
 */
export class MetricasNodoSistema extends MetricasNodoPuerto {
  private anterior: Tiempos = { ocioso: 0, total: 0 };

  constructor(
    private readonly ruta: string,
    private readonly fuente: FuenteSistema = SISTEMA_NODE,
  ) {
    super();
  }

  async nodo(): Promise<UsoNodo> {
    const nucleos = this.fuente.cpus();
    const actual = tiemposDe(nucleos);
    const total = actual.total - this.anterior.total;
    const ocupado = total > 0 ? 1 - (actual.ocioso - this.anterior.ocioso) / total : 0;
    this.anterior = actual;

    const { totalBytes, libreBytes } = this.fuente.memoria();
    const disco = await this.fuente.disco(this.ruta);
    const discoBytes = disco.blocks * disco.bsize;
    return {
      cpu: { usado: redondear(ocupado * nucleos.length), total: nucleos.length },
      memoriaMb: { usado: Math.round((totalBytes - libreBytes) / BYTES_POR_MB), total: Math.round(totalBytes / BYTES_POR_MB) },
      discoGb: { usado: redondear((discoBytes - disco.bavail * disco.bsize) / BYTES_POR_GB), total: redondear(discoBytes / BYTES_POR_GB) },
    };
  }
}
