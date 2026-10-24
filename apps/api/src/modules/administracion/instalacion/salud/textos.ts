const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MINUTO_MS = 60 * 1000;
const HORA_MS = 60 * MINUTO_MS;
export const DIA_MS = 24 * HORA_MS;

/** «18 ene 2027», en UTC como el resto de fechas de la API. */
export function fechaCorta(fecha: Date): string {
  return `${String(fecha.getUTCDate()).padStart(2, "0")} ${MESES[fecha.getUTCMonth()]} ${fecha.getUTCFullYear()}`;
}

/** «hace 2 h», «hace 12 min», «hace 3 d». */
export function haceCuanto(desde: Date, ahora: Date): string {
  const diferencia = Math.max(0, ahora.getTime() - desde.getTime());
  if (diferencia >= DIA_MS) return `hace ${Math.floor(diferencia / DIA_MS)} d`;
  if (diferencia >= HORA_MS) return `hace ${Math.floor(diferencia / HORA_MS)} h`;
  return `hace ${Math.max(1, Math.floor(diferencia / MINUTO_MS))} min`;
}
