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
  /** Contrato recursos-datos: bases por cuenta y disco por base. Opcionales hasta que el catálogo los traiga. */
  maxRecursosDatos?: number;
  discoDatosMb?: number;
}

export type Vigencia = "30" | "365";

export const VIGENCIAS: { value: Vigencia; label: string }[] = [
  { value: "30", label: "30 días" },
  { value: "365", label: "365 días" },
];

export type ClaveRecurso = "maxProyectos" | "cpus" | "memoriaMb" | "construccionesMes" | "maxRecursosDatos" | "discoDatosMb";

const MB_POR_GB = 1024;

export function esGratuito(plan: PlanCatalogo): boolean {
  return plan.precio30 === 0;
}

export function textoPrecio(plan: PlanCatalogo, vigencia: Vigencia): string {
  if (esGratuito(plan)) return "Sin costo";
  const precio = vigencia === "30" ? plan.precio30 : plan.precio365;
  return precio === null ? "No disponible" : textoUsd(precio);
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

/** «512 MB» → «0.5 GB»; el disco por base se lee en GB en la ficha 06. */
export function textoGb(mb: number): string {
  const gb = mb / MB_POR_GB;
  return `${Number.isInteger(gb) ? gb : Number(gb.toFixed(2))} GB`;
}

export interface FilaRecurso {
  clave: ClaveRecurso;
  etiqueta: string;
  formato: (valor: number) => string;
}

export const RECURSOS: FilaRecurso[] = [
  { clave: "maxProyectos", etiqueta: "Proyectos", formato: textoMiles },
  { clave: "cpus", etiqueta: "CPU por proyecto", formato: textoCpu },
  { clave: "memoriaMb", etiqueta: "Memoria por proyecto", formato: textoMemoria },
  { clave: "construccionesMes", etiqueta: "Construcciones / mes", formato: textoMiles },
];

/** Filas de recursos de datos: solo aparecen si algún plan del catálogo las trae. */
export const RECURSOS_DATOS: FilaRecurso[] = [
  { clave: "maxRecursosDatos", etiqueta: "Recursos de datos", formato: textoMiles },
  { clave: "discoDatosMb", etiqueta: "Disco por base", formato: textoGb },
];

const SIN_DATO = "—";
const MESES_PAGADOS_POR_ANIO = 10;

/** Qué bases trae cada plan en la tarifa de lanzamiento (igual que la landing). */
const BASES_INCLUIDAS: Record<string, string> = {
  sandbox: "Ninguna: trae tu propia URL",
  starter: "Aparte, desde USD 2",
  pro: "PostgreSQL + Redis",
  business: "PostgreSQL + Redis + S3",
};

export function textoBasesIncluidas(plan: Pick<PlanCatalogo, "codigo">): string {
  return BASES_INCLUIDAS[plan.codigo] ?? SIN_DATO;
}

/** Bajo el precio: con 30 días, lo que cuesta el año; con 365, que se pagan 10 meses. */
export function textoEquivalencia(plan: PlanCatalogo, vigencia: Vigencia): string {
  if (esGratuito(plan)) return "No vence · sin tarjeta";
  if (plan.precio365 === null) return "Solo por 30 días";
  if (vigencia === "30") return `USD ${plan.precio365.toFixed(2)} por 365 días`;
  return `Pagas ${MESES_PAGADOS_POR_ANIO} meses: dos gratis`;
}

export const INCLUIDO_EN_TODOS = [
  "HTTPS con subdominio propio",
  "Reversión a las últimas 5 versiones sin reconstruir",
  "Bitácoras y métricas de 24 h",
] as const;

export interface ComplementoDatos {
  nombre: string;
  precio30: number;
}

/** Complementos por 30 días, sobre el plan. */
export const COMPLEMENTOS_DATOS: readonly ComplementoDatos[] = [
  { nombre: "PostgreSQL + pgvector · 2 GB", precio30: 5 },
  { nombre: "Redis", precio30: 2 },
  { nombre: "S3 · 10 GB", precio30: 4 },
  { nombre: "+10 GB de disco", precio30: 2 },
];

export function textoUsd(monto: number): string {
  return `USD ${monto.toFixed(2)}`;
}

export function recursosDelCatalogo(planes: readonly PlanCatalogo[]): FilaRecurso[] {
  const opcionales = RECURSOS_DATOS.filter((fila) => planes.some((plan) => typeof plan[fila.clave] === "number"));
  return [...RECURSOS, ...opcionales];
}

/** Valor de la celda; un plan que no trae el campo muestra «—» en vez de romper. */
export function valorRecurso(plan: PlanCatalogo, fila: FilaRecurso): string {
  if (fila.clave === "discoDatosMb" && plan.maxRecursosDatos === 0) return SIN_DATO;
  const valor = plan[fila.clave];
  return typeof valor === "number" ? fila.formato(valor) : SIN_DATO;
}

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
