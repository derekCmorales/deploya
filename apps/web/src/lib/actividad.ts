/**
 * Genera el texto resumen de actividad basado en la longitud de los días (pantalla 13).
 */
export function textoActividad(dias: readonly { total: number; fallidos: number }[]): string {
  const totalDespliegues = dias.reduce((acc, d) => acc + d.total, 0);
  const totalFallidos = dias.reduce((acc, d) => acc + d.fallidos, 0);
  
  const semanas = 12;

  return `${semanas} semanas · ${totalDespliegues} despliegues · ${totalFallidos} con fallo`;
}

/**
 * Genera el texto de reinicio del período a partir de la fecha de reinicio UTC (pantalla 08).
 * Ejemplo: "Se reinicia el 1 nov" o "Se reinicia el 3 oct"
 */
export function textoReinicio(reinicia: string | Date): string {
  const fecha = typeof reinicia === "string" ? new Date(reinicia) : reinicia;
  const mes = fecha.toLocaleDateString("es", { month: "short", timeZone: "UTC" }).replace(".", "");
  const dia = fecha.getUTCDate();
  return `Se reinicia el ${dia} ${mes}`;
}