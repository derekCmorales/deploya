/** Formato de fechas del panel, sin imports para probarlo con `node --test`. */

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/**
 * «22 sep 2026» (fichas 03b y 28). Abreviaturas fijas: `Intl` en español escribe «sept.»
 * según la versión de ICU. `zona` permite fijar la zona en pruebas; por defecto, la del navegador.
 */
export function fechaCorta(iso: string, zona?: string): string | null {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;
  const partes = new Intl.DateTimeFormat("en-US", { timeZone: zona, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(fecha);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => Number(partes.find((p) => p.type === tipo)?.value);
  return `${valor("day")} ${MESES[valor("month") - 1]} ${valor("year")}`;
}
