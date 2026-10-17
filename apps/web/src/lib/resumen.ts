/**
 * Lógica pura de la pantalla 13 (Resumen del proyecto). Sin DOM ni red, para `node --test`.
 */

import type { VistaDespliegue } from "./proyectos";

export interface HitoLineaTiempo {
  etapa: string;
  titulo: string;
  detalle: string;
  marca: string;
}

/** Cuerpo de `GET /proyectos/:id/resumen` (contrato v3). */
export interface ResumenProyecto {
  proyecto: {
    id: string;
    nombre: string;
    subdominio: string;
    url: string | null;
    repositorio: string;
    rama: string;
    receta: string | null;
    puertoInterno: number;
  };
  plan: { codigo: string; nombre: string };
  activo: VistaDespliegue | null;
  ultimo: VistaDespliegue | null;
  recursos: { cpus: number; memoriaMb: number } | null;
  lineaTiempo: HitoLineaTiempo[];
}

const BYTES_POR_MB = 1024 * 1024;
const MS_POR_SEGUNDO = 1000;
const SEGUNDOS_POR_MINUTO = 60;
const PUERTO_HTTP = 80;
const PUERTO_HTTPS = 443;

/** «148 MB». */
export function tamanoImagen(bytes: number): string {
  return `${Math.round(bytes / BYTES_POR_MB)} MB`;
}

/** «0.5 vCPU» · «512 MB» para los datos de «Recursos aplicados». */
export function textoCpu(cpus: number): string {
  return `${cpus} vCPU`;
}

export function textoMemoria(memoriaMb: number): string {
  return `${memoriaMb} MB`;
}

/** «8080 → 443» con TLS y «8080 → 80» sin él (desarrollo). */
export function textoPuerto(puertoInterno: number, esquema: string): string {
  return `${puertoInterno} → ${esquema === "https" ? PUERTO_HTTPS : PUERTO_HTTP}`;
}

/** «Actualizado hace 4 s» · «Actualizado hace 2 min». */
export function textoActualizado(actualizadoMs: number, ahoraMs: number): string {
  const segundos = Math.max(0, Math.floor((ahoraMs - actualizadoMs) / MS_POR_SEGUNDO));
  if (segundos < SEGUNDOS_POR_MINUTO) return `Actualizado hace ${segundos} s`;
  return `Actualizado hace ${Math.floor(segundos / SEGUNDOS_POR_MINUTO)} min`;
}

/** «148 MB · construida en 1 min 52 s»; sin duración (una reversión no construye) solo el tamaño. */
export function detalleImagen(imagen: NonNullable<VistaDespliegue["imagen"]>, construccion: string | null): string {
  const tamano = tamanoImagen(imagen.tamanoBytes);
  return construccion === null ? tamano : `${tamano} · construida en ${construccion}`;
}

/** Duración de la etapa Construcción del despliegue, si la hubo. */
export function duracionConstruccion(despliegue: Pick<VistaDespliegue, "etapas">): number | null {
  const etapa = despliegue.etapas.find((e) => e.nombre === "construccion");
  return etapa?.duracionMs ?? null;
}

/** Hora `HH:mm:ss` en UTC de un hito de la línea de tiempo. */
export function horaHito(marca: string): string {
  const fecha = new Date(marca);
  const parte = (valor: number) => String(valor).padStart(2, "0");
  return `${parte(fecha.getUTCHours())}:${parte(fecha.getUTCMinutes())}:${parte(fecha.getUTCSeconds())}`;
}

/** Milisegundos entre el alta y el fin del despliegue, o `null` mientras corre. */
export function duracionTotalMs(despliegue: Pick<VistaDespliegue, "creado" | "terminado">): number | null {
  if (!despliegue.creado || !despliegue.terminado) return null;
  return new Date(despliegue.terminado).getTime() - new Date(despliegue.creado).getTime();
}

/** El sondeo sigue mientras el activo o el último estén en curso, o hasta que una acción cambie el estado. */
export function seguirResumen(resumen: ResumenProyecto, origen: string | null, enCurso: (estado: string) => boolean): boolean {
  if (origen !== null && resumen.activo?.estado === origen) return true;
  return [resumen.activo, resumen.ultimo].some((d) => d !== null && enCurso(d.estado));
}
