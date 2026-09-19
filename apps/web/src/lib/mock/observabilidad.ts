import type { EtapaCiclo } from "@/lib/mock/proyectos";

export type LineaBitacora = {
  t: string;
  canal: "construccion" | "runtime";
  texto: string;
};

export type MetricasEntorno = {
  cpuPct: number;
  cpuLimite: number;
  memoriaPct: number;
  memoriaLimiteGi: number;
  transferenciaPct: number;
  transferenciaLimiteGi: number;
  avisoCuota: boolean;
};

export type ObservabilidadMock = {
  metricas: MetricasEntorno;
  bitacoras: LineaBitacora[];
};

const base: Record<string, ObservabilidadMock> = {
  "tienda-web": {
    metricas: {
      cpuPct: 92,
      cpuLimite: 100,
      memoriaPct: 71,
      memoriaLimiteGi: 2,
      transferenciaPct: 64,
      transferenciaLimiteGi: 100,
      avisoCuota: true,
    },
    bitacoras: [
      { t: "14:02:01", canal: "runtime", texto: "GET /salud 200 4ms" },
      { t: "14:02:08", canal: "runtime", texto: "GET /catalogo 200 18ms" },
      {
        t: "14:03:11",
        canal: "runtime",
        texto: "aviso: CPU al 92 % del límite del plan",
      },
      { t: "14:04:22", canal: "runtime", texto: "POST /pedido 201 41ms" },
    ],
  },
  "api-catalogo": {
    metricas: {
      cpuPct: 18,
      cpuLimite: 100,
      memoriaPct: 22,
      memoriaLimiteGi: 1,
      transferenciaPct: 4,
      transferenciaLimiteGi: 50,
      avisoCuota: false,
    },
    bitacoras: [
      {
        t: "14:05:02",
        canal: "construccion",
        texto: "Detectando stack: Node 22, Next no aplica",
      },
      {
        t: "14:05:09",
        canal: "construccion",
        texto: "Empaquetando artefacto versionado api-catalogo@v4",
      },
      {
        t: "14:05:21",
        canal: "construccion",
        texto: "Capa de dependencias reutilizada",
      },
    ],
  },
  "landing-evento": {
    metricas: {
      cpuPct: 0,
      cpuLimite: 50,
      memoriaPct: 0,
      memoriaLimiteGi: 0.5,
      transferenciaPct: 0,
      transferenciaLimiteGi: 20,
      avisoCuota: false,
    },
    bitacoras: [
      {
        t: "13:54:00",
        canal: "construccion",
        texto: "Fuente archivo comprimido registrada. Encolado.",
      },
    ],
  },
  "panel-interno": {
    metricas: {
      cpuPct: 0,
      cpuLimite: 100,
      memoriaPct: 0,
      memoriaLimiteGi: 1,
      transferenciaPct: 0,
      transferenciaLimiteGi: 50,
      avisoCuota: false,
    },
    bitacoras: [
      {
        t: "13:38:12",
        canal: "construccion",
        texto: "npm run build ok",
      },
      {
        t: "13:38:40",
        canal: "construccion",
        texto: "error: el proceso no escucha en el puerto HTTP declarado",
      },
    ],
  },
  "docs-publicos": {
    metricas: {
      cpuPct: 12,
      cpuLimite: 50,
      memoriaPct: 30,
      memoriaLimiteGi: 0.5,
      transferenciaPct: 9,
      transferenciaLimiteGi: 20,
      avisoCuota: false,
    },
    bitacoras: [
      {
        t: "14:04:01",
        canal: "runtime",
        texto: "Contenedor listo. Publicando subdominio docs.deploya.app",
      },
      {
        t: "14:04:18",
        canal: "runtime",
        texto: "Solicitando certificado TLS al borde (mock)",
      },
    ],
  },
  "bot-avisos": {
    metricas: {
      cpuPct: 8,
      cpuLimite: 50,
      memoriaPct: 14,
      memoriaLimiteGi: 0.5,
      transferenciaPct: 2,
      transferenciaLimiteGi: 20,
      avisoCuota: false,
    },
    bitacoras: [
      {
        t: "13:59:44",
        canal: "runtime",
        texto: "Aprovisionando contenedor con límites del plan",
      },
      {
        t: "14:00:02",
        canal: "runtime",
        texto: "Aplicando CPU=0.5 memoria=512Mi",
      },
    ],
  },
  "sitio-archivo": {
    metricas: {
      cpuPct: 0,
      cpuLimite: 50,
      memoriaPct: 0,
      memoriaLimiteGi: 0.5,
      transferenciaPct: 11,
      transferenciaLimiteGi: 20,
      avisoCuota: false,
    },
    bitacoras: [
      {
        t: "12:10:00",
        canal: "runtime",
        texto: "Entorno detenido. Artefacto v3 inmutable conservado.",
      },
    ],
  },
};

const vacio: ObservabilidadMock = {
  metricas: {
    cpuPct: 0,
    cpuLimite: 50,
    memoriaPct: 0,
    memoriaLimiteGi: 0.5,
    transferenciaPct: 0,
    transferenciaLimiteGi: 20,
    avisoCuota: false,
  },
  bitacoras: [],
};

export function observabilidadDe(id: string): ObservabilidadMock {
  return base[id] ?? vacio;
}

export function etiquetaCanal(
  canal: LineaBitacora["canal"],
  etapa?: EtapaCiclo,
): string {
  if (canal === "construccion") return "construcción";
  return etapa === "operacion" ? "runtime" : "runtime";
}
