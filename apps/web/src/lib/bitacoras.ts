/**
 * Pantalla 15 · Bitácoras de ejecución (SP-12). Funciones puras: el panel y el hook solo las
 * llaman, así la pausa, el filtro y la descarga se prueban sin React ni red.
 */

export type NivelEjecucion = "info" | "aviso" | "error";
export type FiltroNivel = NivelEjecucion | "todos";

/** `GET /proyectos/:id/bitacora?desde=` */
export interface RespuestaBitacora {
  despliegue: { numero: number; commit: string | null } | null;
  lineas: { en: string; texto: string; nivel: NivelEjecucion }[];
  aviso: string | null;
}

export interface LineaEjecucion {
  n: number;
  /** ISO de Docker: el cursor `desde` de la siguiente consulta. */
  en: string;
  texto: string;
  nivel: NivelEjecucion;
}

export interface EstadoBitacora {
  lineas: LineaEjecucion[];
  /** Lo que llegó mientras estaba en pausa: se muestra al reanudar. */
  pendientes: LineaEjecucion[];
  pausada: boolean;
  /** Número de la última línea recibida, visible o pendiente. */
  ultimo: number;
}

export const MAX_LINEAS_BITACORA = 500;
export const INTERVALO_BITACORA_MS = 3000;
export const ESTADO_BITACORA_INICIAL: EstadoBitacora = { lineas: [], pendientes: [], pausada: false, ultimo: 0 };

export const OPCIONES_NIVEL: { value: FiltroNivel; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "info", label: "Info" },
  { value: "aviso", label: "Aviso" },
  { value: "error", label: "Error" },
];

const ultimas = (lineas: LineaEjecucion[]) => lineas.slice(-MAX_LINEAS_BITACORA);

/** Numera lo nuevo a partir de la última línea; en pausa lo aparta sin perderlo. */
export function recibirLineas(estado: EstadoBitacora, nuevas: RespuestaBitacora["lineas"]): EstadoBitacora {
  if (nuevas.length === 0) return estado;
  const numeradas = nuevas.map((linea, i) => ({ ...linea, n: estado.ultimo + i + 1 }));
  const ultimo = estado.ultimo + nuevas.length;
  if (estado.pausada) return { ...estado, pendientes: ultimas([...estado.pendientes, ...numeradas]), ultimo };
  return { ...estado, lineas: ultimas([...estado.lineas, ...numeradas]), ultimo };
}

export function pausar(estado: EstadoBitacora): EstadoBitacora {
  return { ...estado, pausada: true };
}

export function reanudar(estado: EstadoBitacora): EstadoBitacora {
  return { ...estado, pausada: false, lineas: ultimas([...estado.lineas, ...estado.pendientes]), pendientes: [] };
}

/** Marca de la última línea recibida (visible o pendiente): la API devuelve solo lo posterior. */
export function cursorDe(estado: EstadoBitacora): string | null {
  return (estado.pendientes.at(-1) ?? estado.lineas.at(-1))?.en ?? null;
}

/** Nivel y búsqueda sin distinguir mayúsculas; la búsqueda es texto, no una expresión regular. */
export function filtrarLineas(lineas: LineaEjecucion[], nivel: FiltroNivel, busqueda: string): LineaEjecucion[] {
  const buscado = busqueda.trim().toLowerCase();
  return lineas.filter((l) => (nivel === "todos" || l.nivel === nivel) && (!buscado || l.texto.toLowerCase().includes(buscado)));
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** «En pausa · 6 líneas nuevas». */
export function textoPausa(pendientes: number): string {
  return `En pausa · ${plural(pendientes, "línea nueva", "líneas nuevas")}`;
}

/** «17 líneas · 1 error · 1 aviso» de lo que se ve. */
export function textoResumen(lineas: LineaEjecucion[]): string {
  const errores = lineas.filter((l) => l.nivel === "error").length;
  const avisos = lineas.filter((l) => l.nivel === "aviso").length;
  return `${plural(lineas.length, "línea", "líneas")} · ${plural(errores, "error", "errores")} · ${plural(avisos, "aviso", "avisos")}`;
}

/** «versión #14 · a1b2c3d». */
export function textoVersion(despliegue: RespuestaBitacora["despliegue"]): string | null {
  if (!despliegue) return null;
  return despliegue.commit ? `versión #${despliegue.numero} · ${despliegue.commit.slice(0, 7)}` : `versión #${despliegue.numero}`;
}

const MS_POR_SEGUNDO = 1000;

/** «Actualizado hace 2 s · cada 3 s». */
export function textoActualizado(leidoEn: string | null, ahora: Date): string | null {
  if (!leidoEn) return null;
  const segundos = Math.max(0, Math.round((ahora.getTime() - new Date(leidoEn).getTime()) / MS_POR_SEGUNDO));
  return `Actualizado hace ${segundos} s · cada ${INTERVALO_BITACORA_MS / MS_POR_SEGUNDO} s`;
}

/** El archivo de «Descargar»: una línea por renglón con su marca ISO, tal como salió del contenedor. */
export function textoDescarga(lineas: LineaEjecucion[]): string {
  return lineas.map((l) => `${l.en} ${l.texto}`).join("\n") + (lineas.length ? "\n" : "");
}

export function nombreDescarga(proyecto: string, ahora: Date): string {
  return `${proyecto}-${ahora.toISOString().replace(/[:.]/g, "-")}.log`;
}
