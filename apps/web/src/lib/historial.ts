/**
 * Lógica pura de la pantalla 14 (Despliegues): filtros, consulta paginada y la acción de cada fila.
 * Sin DOM ni red, para `node --test`.
 */

export const FILTROS_HISTORIAL = [
  { value: "todos", label: "Todos" },
  { value: "saludables", label: "Saludables" },
  { value: "fallidos", label: "Fallidos" },
] as const;

export type FiltroHistorial = (typeof FILTROS_HISTORIAL)[number]["value"];

/** Una fila de `GET /proyectos/:id/despliegues` (contrato v3). */
export interface FilaHistorial {
  id: string;
  numero: number;
  estado: string;
  disparador: string;
  commit: { sha: string; mensaje: string; rama: string } | null;
  creado: string;
  duracionMs: number | null;
  imagen: { digest: string; disponible: boolean } | null;
  artefactoId: string | null;
  activo: boolean;
}

export interface PaginaHistorial {
  despliegues: FilaHistorial[];
  siguiente: number | null;
}

/** Lo que ofrece la fila en la columna de acciones. */
export type AccionFila = "revertir" | "reintentar" | "imagen-retirada" | "version-activa" | "ninguna";

const SEGUNDOS_POR_MINUTO = 60;
const MS_POR_SEGUNDO = 1000;
const LARGO_DIGEST_INICIAL = 15;
const LARGO_DIGEST_FINAL = 4;
const ESTADOS_REDESPLEGABLES = ["saludable", "detenido"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;
const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * La acción principal de la fila (tabla de decisión: la tabla pinta lo que dice esta función).
 * La versión activa no se revierte; un fallido se reintenta; con la imagen en el nodo se revierte
 * sin reconstruir y, si la retención ya la borró, se dice «imagen retirada».
 */
export function accionDeFila(fila: FilaHistorial): AccionFila {
  if (fila.activo) return "version-activa";
  if (fila.estado === "fallido") return "reintentar";
  if (!fila.imagen) return "ninguna";
  return fila.imagen.disponible ? "revertir" : "imagen-retirada";
}

/** «Redesplegar» reconstruye el commit de una fila que llegó a servir tráfico (no de la activa ni de un fallo). */
export function puedeRedesplegar(fila: FilaHistorial): boolean {
  return fila.commit !== null && !fila.activo && ESTADOS_REDESPLEGABLES.includes(fila.estado);
}

export type AccionEjecutable = "revertir" | "redesplegar" | "reintentar";

/** La llamada de cada acción de fila (contrato v2 y v3); las tres responden con el despliegue nuevo. */
export function peticionDeAccion(accion: AccionEjecutable, fila: FilaHistorial, proyectoId: string): { ruta: string; cuerpo?: unknown } {
  if (accion === "revertir") return { ruta: `/proyectos/${proyectoId}/reversiones`, cuerpo: { artefactoId: fila.artefactoId } };
  if (accion === "redesplegar") return { ruta: `/proyectos/${proyectoId}/redespliegues`, cuerpo: { commitSha: fila.commit?.sha } };
  return { ruta: `/despliegues/${fila.id}/reintentar` };
}

/** Ruta de `GET /proyectos/:id/despliegues` con filtro y cursor (`antesDe` solo si hay página anterior). */
export function consultaHistorial(proyectoId: string, filtro: FiltroHistorial, antesDe: number | null): string {
  const parametros = new URLSearchParams({ filtro });
  if (antesDe !== null) parametros.set("antesDe", String(antesDe));
  return `/proyectos/${proyectoId}/despliegues?${parametros.toString()}`;
}

/** Suma una página a las ya cargadas sin repetir filas ni desordenarlas (del #n más reciente al más antiguo). */
export function fusionarPaginas(previas: FilaHistorial[], nueva: FilaHistorial[]): FilaHistorial[] {
  const vistas = new Set(previas.map((fila) => fila.id));
  return [...previas, ...nueva.filter((fila) => !vistas.has(fila.id))].sort((a, b) => b.numero - a.numero);
}

/** «sha256:9f2c4e7a…e41a». */
export function digestCorto(digest: string): string {
  if (digest.length <= LARGO_DIGEST_INICIAL + LARGO_DIGEST_FINAL) return digest;
  return `${digest.slice(0, LARGO_DIGEST_INICIAL)}…${digest.slice(-LARGO_DIGEST_FINAL)}`;
}

/** «2 min 41 s» · «0 min 38 s» · «—» mientras no terminó. */
export function duracionFila(duracionMs: number | null): string {
  if (duracionMs === null) return "—";
  const total = Math.round(duracionMs / MS_POR_SEGUNDO);
  return `${Math.floor(total / SEGUNDOS_POR_MINUTO)} min ${String(total % SEGUNDOS_POR_MINUTO).padStart(2, "0")} s`;
}

/** «hoy, 12:04» · «ayer, 18:31» · «21 sep, 10:02», en UTC como la bitácora. */
export function fechaFila(iso: string, ahora: Date): string {
  const fecha = new Date(iso);
  const hora = `${dosDigitos(fecha.getUTCHours())}:${dosDigitos(fecha.getUTCMinutes())}`;
  const dias = diasDesdeEpoca(ahora) - diasDesdeEpoca(fecha);
  if (dias === 0) return `hoy, ${hora}`;
  if (dias === 1) return `ayer, ${hora}`;
  return `${fecha.getUTCDate()} ${MESES[fecha.getUTCMonth()]}, ${hora}`;
}

function dosDigitos(valor: number): string {
  return String(valor).padStart(2, "0");
}

function diasDesdeEpoca(fecha: Date): number {
  return Math.floor(fecha.getTime() / DIA_MS);
}
