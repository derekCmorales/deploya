import type { EstadoDespliegue } from "../../../construccion/dominio/estados";
import { CADA_MS_MUESTREO } from "../../../orquestacion/metricas/metricas.constantes";
import type { LecturaInfraestructura, TrabajoEnCola } from "../puertos/consulta-infraestructura.puerto";
import type { UsoNodo } from "../puertos/metricas-nodo.puerto";

export const VENTANA_FALLIDAS_MS = 24 * 60 * 60 * 1000;
/** Una muestra más vieja que dos rondas del muestreo ya no describe al contenedor. */
export const VIGENCIA_MUESTRA_MS = 2 * CADA_MS_MUESTREO;

export const ESTADOS_EN_CURSO: readonly EstadoDespliegue[] = ["construyendo", "aprovisionando", "publicando", "revirtiendo"];
export const ESTADOS_EN_COLA: readonly EstadoDespliegue[] = ["encolado", ...ESTADOS_EN_CURSO];

export interface TrabajoVista {
  proyecto: string;
  numero: number;
  estado: EstadoDespliegue;
  /** En curso: desde que empezó. Encolado: cuánto lleva esperando. */
  ms: number;
}

export interface EntornoVista {
  proyecto: string;
  titular: string;
  estado: EstadoDespliegue;
  cpu: number | null;
  memoriaMb: number | null;
}

export interface VistaInfraestructura {
  tomado: Date;
  nodo: UsoNodo;
  cola: { enEspera: number; enCurso: number; fallidas24h: number; trabajos: TrabajoVista[] };
  entornos: EntornoVista[];
  totalProyectos: number;
}

const enCurso = (t: Pick<TrabajoEnCola, "estado">) => ESTADOS_EN_CURSO.includes(t.estado);

function trabajoVista(trabajo: TrabajoEnCola, ahora: Date): TrabajoVista {
  const desde = enCurso(trabajo) ? (trabajo.iniciado ?? trabajo.creado) : trabajo.creado;
  return { proyecto: trabajo.proyecto, numero: trabajo.numero, estado: trabajo.estado, ms: Math.max(0, ahora.getTime() - desde.getTime()) };
}

/** Primero lo que corre y luego lo que espera, del más antiguo al más nuevo (orden de BullMQ). */
const ordenCola = (a: TrabajoEnCola, b: TrabajoEnCola) => Number(enCurso(b)) - Number(enCurso(a)) || a.creado.getTime() - b.creado.getTime();

/** Facade pura de 27: nodo, cola y entornos con la última muestra vigente. */
export function vistaInfraestructura(nodo: UsoNodo, lectura: LecturaInfraestructura, ahora: Date): VistaInfraestructura {
  const trabajos = [...lectura.trabajos].sort(ordenCola);
  return {
    tomado: ahora,
    nodo,
    cola: {
      enEspera: trabajos.filter((t) => !enCurso(t)).length,
      enCurso: trabajos.filter(enCurso).length,
      fallidas24h: lectura.fallidas,
      trabajos: trabajos.map((t) => trabajoVista(t, ahora)),
    },
    entornos: lectura.entornos.map(({ muestra, ...entorno }) => {
      const vigente = muestra && ahora.getTime() - muestra.tomada.getTime() <= VIGENCIA_MUESTRA_MS ? muestra : null;
      return { ...entorno, cpu: vigente?.cpu ?? null, memoriaMb: vigente?.memoriaMb ?? null };
    }),
    totalProyectos: lectura.totalProyectos,
  };
}
