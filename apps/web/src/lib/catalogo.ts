/**
 * El catálogo del design system (`/sistema`) es una herramienta del equipo, no una pantalla del
 * producto: se ve en desarrollo y, en producción, solo si se pide al construir.
 */
export function catalogoVisible(entorno: string | undefined, forzar: string | undefined): boolean {
  return entorno !== "production" || forzar === "1";
}
