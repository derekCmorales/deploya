/** Formatos de los avisos de 24b. Funciones puras: el reloj y los datos llegan como argumentos. */

const MS_POR_SEGUNDO = 1000;
const SEGUNDOS_POR_MINUTO = 60;
const MINUTOS_POR_HORA = 60;
export const MS_POR_DIA = 24 * 60 * 60 * MS_POR_SEGUNDO;
const LARGO_COMMIT = 7;
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** «41 s», «2 min 41 s», «1 h 5 min». */
export function duracionLegible(ms: number): string {
  const segundos = Math.max(0, Math.round(ms / MS_POR_SEGUNDO));
  const minutos = Math.floor(segundos / SEGUNDOS_POR_MINUTO);
  const horas = Math.floor(minutos / MINUTOS_POR_HORA);
  if (horas > 0) return `${horas} h ${minutos % MINUTOS_POR_HORA} min`;
  if (minutos > 0) return `${minutos} min ${segundos % SEGUNDOS_POR_MINUTO} s`;
  return `${segundos} s`;
}

/** «03 nov 2026» (24b). Fecha de calendario en UTC: la vigencia se guarda como día, sin hora local. */
export function fechaAviso(iso: string): string {
  const fecha = new Date(iso);
  const dia = String(fecha.getUTCDate()).padStart(2, "0");
  return `${dia} ${MESES[fecha.getUTCMonth()]} ${fecha.getUTCFullYear()}`;
}

/** Los primeros 7 caracteres del commit, como en el riel y el historial. */
export function commitCorto(commit: string): string {
  return commit.slice(0, LARGO_COMMIT);
}

/** «https://api-tienda.deploya.app/» → «api-tienda.deploya.app». */
export function hostDe(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** Días que faltan hasta `venceEl`, redondeados hacia arriba; nunca menos de 1. */
export function diasHasta(venceEl: string, ahora: Date): number {
  return Math.max(1, Math.ceil((new Date(venceEl).getTime() - ahora.getTime()) / MS_POR_DIA));
}

/** «el contenedor» / «los 3 contenedores». */
export function contenedoresDetenidos(cantidad: number): string {
  return cantidad === 1 ? "el contenedor" : `los ${cantidad} contenedores`;
}
