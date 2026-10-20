const DIAS_POR_SEMANA = 7;

/**
 * Resumen del mapa de actividad (pantalla 13): las semanas salen de los días que manda la API.
 * Ejemplo con 84 días: «12 semanas · 38 despliegues · 2 con fallo».
 */
export function textoActividad(dias: readonly { total: number; fallidos: number }[]): string {
  const semanas = Math.round(dias.length / DIAS_POR_SEMANA);
  const totalDespliegues = dias.reduce((acc, d) => acc + d.total, 0);
  const totalFallidos = dias.reduce((acc, d) => acc + d.fallidos, 0);
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
