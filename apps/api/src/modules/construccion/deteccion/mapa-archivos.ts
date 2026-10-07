/** Contenido de cada archivo que pidieron las recetas; `null` si no existe en la rama. */
export type MapaArchivos = Readonly<Record<string, string | null>>;

export function existe(archivos: MapaArchivos, ruta: string): boolean {
  return typeof archivos[ruta] === "string";
}

export function presentes(archivos: MapaArchivos, rutas: readonly string[]): string[] {
  return rutas.filter((ruta) => existe(archivos, ruta));
}
