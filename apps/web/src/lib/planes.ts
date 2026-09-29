/**
 * Catálogo público (pantalla 06): tipos del contrato `GET /suscripciones/planes`
 * y formato de importes y recursos. Funciones puras, sin React ni red.
 */
export interface PlanCatalogo {
  codigo: string;
  nombre: string;
  descripcion: string;
  precio30: number;
  precio365: number | null;
  maxProyectos: number;
  cpus: number;
  memoriaMb: number;
  construccionesMes: number;
}

export type Vigencia = "30" | "365";

export const VIGENCIAS: { value: Vigencia; label: string }[] = [
  { value: "30", label: "30 días" },
  { value: "365", label: "365 días" },
];

export type ClaveRecurso = "maxProyectos" | "cpus" | "memoriaMb" | "construccionesMes";

const MB_POR_GB = 1024;

export function esGratuito(plan: PlanCatalogo): boolean {
  return plan.precio30 === 0;
}

export function textoPrecio(plan: PlanCatalogo, vigencia: Vigencia): string {
  if (esGratuito(plan)) return "Sin costo";
  const precio = vigencia === "30" ? plan.precio30 : plan.precio365;
  return precio === null ? "No disponible" : `USD ${precio.toFixed(2)}`;
}

export function textoPeriodo(plan: PlanCatalogo, vigencia: Vigencia): string | null {
  return esGratuito(plan) ? null : `/ ${vigencia} días`;
}

export function textoMiles(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function textoCpu(cpus: number): string {
  return `${cpus} vCPU`;
}

export function textoMemoria(memoriaMb: number): string {
  return memoriaMb >= MB_POR_GB && memoriaMb % MB_POR_GB === 0 ? `${memoriaMb / MB_POR_GB} GB` : `${memoriaMb} MB`;
}

export const RECURSOS: { clave: ClaveRecurso; etiqueta: string; formato: (valor: number) => string }[] = [
  { clave: "maxProyectos", etiqueta: "Proyectos", formato: textoMiles },
  { clave: "cpus", etiqueta: "CPU por proyecto", formato: textoCpu },
  { clave: "memoriaMb", etiqueta: "Memoria por proyecto", formato: textoMemoria },
  { clave: "construccionesMes", etiqueta: "Construcciones / mes", formato: textoMiles },
];

export class ErrorCatalogo extends Error {
  readonly estado: number;

  constructor(estado: number) {
    super(`El catálogo respondió ${estado}`);
    this.name = "ErrorCatalogo";
    this.estado = estado;
  }
}

export async function obtenerPlanes(baseApi: string, pedir: typeof fetch = fetch): Promise<PlanCatalogo[]> {
  const respuesta = await pedir(`${baseApi}/suscripciones/planes`);
  if (!respuesta.ok) throw new ErrorCatalogo(respuesta.status);
  return (await respuesta.json()) as PlanCatalogo[];
}
