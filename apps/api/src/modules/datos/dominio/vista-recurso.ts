import { conectadoA, type EstadoRecursoDatos, type RecursoDatos, type TipoRecurso } from "./recurso-datos";
import { nombresVariables, tipoRecursoDe } from "./tipo-recurso-datos";

/** Dónde publica el enrutador de borde (lo mismo que `ConfiguracionEnrutamiento` de M6). */
export interface DominioPublico {
  esquema: string;
  dominioBase: string;
}

/** Etiqueta del enrutador para el S3 del proyecto: `<subdominio>-s3` (comodín DNS-01, sin certificado nuevo). */
export function subdominioPublico(subdominioDueno: string, tipo: TipoRecurso): string {
  return `${subdominioDueno}-${tipo}`;
}

/** URL pública del recurso o `null` si el tipo no tiene ruta (solo `s3` la tiene). */
export function urlPublicaDe(tipo: TipoRecurso, subdominioDueno: string, dominio: DominioPublico): string | null {
  if (!tipoRecursoDe(tipo).publico) return null;
  return `${dominio.esquema}://${subdominioPublico(subdominioDueno, tipo)}.${dominio.dominioBase}`;
}

export interface ProyectoReferencia {
  id: string;
  nombre: string;
}

/** `VistaRecursoDatos` del contrato: sin secretos, solo los nombres de las variables. */
export interface VistaRecursoDatos {
  id: string;
  tipo: TipoRecurso;
  nombre: string;
  estado: EstadoRecursoDatos;
  detalle: string | null;
  host: string;
  puerto: number;
  urlPublica: string | null;
  esDueno: boolean;
  proyectoDueno: ProyectoReferencia;
  compartidoCon: ProyectoReferencia[];
  usoDiscoMb: number | null;
  limiteDiscoMb: number;
  variablesInyectadas: string[];
  creado: string;
}

export interface ContextoVista {
  /** El proyecto desde el que se mira (`:id`). */
  proyectoId: string;
  /** Proyectos del usuario por id, con su subdominio. */
  proyectos: ReadonlyMap<string, ProyectoReferencia & { subdominio: string }>;
  limiteDiscoMb: number;
  dominio: DominioPublico;
}

const SIN_NOMBRE = "(proyecto eliminado)";

function referencia(contexto: ContextoVista, proyectoId: string): ProyectoReferencia {
  const proyecto = contexto.proyectos.get(proyectoId);
  return { id: proyectoId, nombre: proyecto?.nombre ?? SIN_NOMBRE };
}

export function vistaRecurso(recurso: RecursoDatos, contexto: ContextoVista): VistaRecursoDatos {
  const estrategia = tipoRecursoDe(recurso.tipo);
  const dueno = contexto.proyectos.get(recurso.proyectoId);
  return {
    id: recurso.id,
    tipo: recurso.tipo,
    nombre: estrategia.nombre,
    estado: recurso.estado,
    detalle: recurso.detalle,
    host: recurso.contenedor,
    puerto: estrategia.puerto,
    urlPublica: dueno ? urlPublicaDe(recurso.tipo, dueno.subdominio, contexto.dominio) : null,
    esDueno: recurso.proyectoId === contexto.proyectoId,
    proyectoDueno: referencia(contexto, recurso.proyectoId),
    compartidoCon: recurso.compartidoCon.map((id) => referencia(contexto, id)),
    usoDiscoMb: recurso.usoDiscoMb,
    limiteDiscoMb: contexto.limiteDiscoMb,
    variablesInyectadas: nombresVariables(recurso.tipo),
    creado: recurso.creado.toISOString(),
  };
}

/** Dueños primero y después por tipo, para que la lista no salte entre sondeos. */
export function enOrden(recursos: RecursoDatos[], proyectoId: string): RecursoDatos[] {
  return [...recursos]
    .filter((recurso) => conectadoA(recurso, proyectoId))
    .sort((a, b) => Number(b.proyectoId === proyectoId) - Number(a.proyectoId === proyectoId) || a.tipo.localeCompare(b.tipo));
}
