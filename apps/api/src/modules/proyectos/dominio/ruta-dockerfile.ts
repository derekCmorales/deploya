import { RutaInvalida } from "./errores";

/**
 * Ruta del Dockerfile relativa al repositorio, la misma regla en el alta (11a) y en Configuración (19).
 * «/Dockerfile», «./Dockerfile» y «Dockerfile» son lo mismo; «..», segmentos vacíos y `\` no se aceptan.
 */
export function rutaDockerfileDe(valor: unknown): string {
  const ruta = (typeof valor === "string" ? valor.trim() : "").replace(/^(\.?\/)+/, "");
  const segmentos = ruta.split("/");
  const invalida = !ruta || ruta.includes("\\") || ruta.includes("\0") || segmentos.some((s) => s === ".." || s === "");
  if (invalida) throw new RutaInvalida();
  return ruta;
}
