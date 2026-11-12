/** Tipos del contrato recursos-datos.md. */
export type TipoRecurso = "postgres" | "redis" | "s3";

export const TIPOS_RECURSO: readonly TipoRecurso[] = ["postgres", "redis", "s3"];

/** Estados del recurso de datos: no son estados de despliegue (§4.4 de M4) ni de suscripción (M2). */
export type EstadoRecursoDatos = "creando" | "disponible" | "detenido" | "error";

/**
 * Agregado: una base administrada con volumen persistente. `proyectoId` es el dueño;
 * `compartidoCon` son los otros proyectos del mismo usuario que la tienen en su red.
 */
export interface RecursoDatos {
  id: string;
  proyectoId: string;
  tipo: TipoRecurso;
  estado: EstadoRecursoDatos;
  detalle: string | null;
  /** También es el host en la red del proyecto. */
  contenedor: string;
  volumen: string;
  contrasenaCifrada: string;
  usoDiscoMb: number | null;
  medidoEn: Date | null;
  creado: Date;
  compartidoCon: string[];
}

export type NuevoRecursoDatos = Pick<RecursoDatos, "proyectoId" | "tipo" | "contenedor" | "volumen" | "contrasenaCifrada">;

export function esTipoRecurso(valor: unknown): valor is TipoRecurso {
  return typeof valor === "string" && (TIPOS_RECURSO as readonly string[]).includes(valor);
}

export function conectadoA(recurso: RecursoDatos, proyectoId: string): boolean {
  return recurso.proyectoId === proyectoId || recurso.compartidoCon.includes(proyectoId);
}

const PREFIJO_DATOS = "deploya-datos";

/** `deploya-datos-<subdominio-dueño>-<tipo>`: nombre del contenedor, host en la red y nombre del volumen. */
export function nombreRecursoDatos(subdominioDueno: string, tipo: TipoRecurso): string {
  return `${PREFIJO_DATOS}-${subdominioDueno}-${tipo}`;
}
