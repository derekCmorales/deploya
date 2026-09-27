import type {
  DisparadorDespliegue,
  EstadoDespliegue,
  EstadoEtapa,
  Etapa,
  NivelBitacora,
  PlanPipeline,
  RecetaConstruccion,
} from "./estados";

export interface Commit {
  sha: string;
  mensaje: string;
  autor: string;
}

export interface EtapaRegistrada {
  etapa: Etapa;
  estado: EstadoEtapa;
  iniciada: Date | null;
  terminada: Date | null;
}

export interface Despliegue {
  id: string;
  proyectoId: string;
  numero: number;
  estado: EstadoDespliegue;
  disparador: DisparadorDespliegue;
  rama: string;
  commit: Commit | null;
  artefactoId: string | null;
  contenedorId: string | null;
  url: string | null;
  cpus: number | null;
  memoriaMb: number | null;
  codigoSalida: number | null;
  motivoFallo: string | null;
  creado: Date;
  terminado: Date | null;
  etapas: EtapaRegistrada[];
}

export interface Artefacto {
  id: string;
  proyectoId: string;
  numero: number;
  imagen: string;
  digest: string;
  tamanoBytes: number;
  commitSha: string;
  receta: RecetaConstruccion;
  disponible: boolean;
  creado: Date;
}

export interface LineaBitacora {
  n: number;
  marca: Date;
  etapa: Etapa;
  nivel: NivelBitacora;
  texto: string;
}

/** Lo que el motor necesita saber del proyecto (lo escribe M3). */
export interface ProyectoDesplegable {
  id: string;
  usuarioId: string;
  subdominio: string;
  urlRepositorio: string;
  rama: string;
  rutaDockerfile: string;
  puertoInterno: number;
}

/** Comando serializable que viaja por la cola (patrón Command). */
export interface TrabajoDespliegue {
  despliegueId: string;
  plan: PlanPipeline;
}

export interface DespliegueCreado {
  id: string;
  numero: number;
  estado: EstadoDespliegue;
}
