import { ConsultaInvalida } from "./errores";

export const USUARIOS_POR_PAGINA = 20;

export type EstadoSuscripcionAdmin = "activa" | "por-vencer" | "vencida" | "suspendida" | "cancelada";
const ESTADOS_SUSCRIPCION: readonly EstadoSuscripcionAdmin[] = ["activa", "por-vencer", "vencida", "suspendida", "cancelada"];

export interface FiltroUsuarios {
  correo: string | null;
  suscripcion: EstadoSuscripcionAdmin | null;
  pagina: number;
}

/** Una fila de la tabla de 25. */
export interface FilaUsuario {
  id: string;
  correo: string;
  nombre: string;
  rol: "cliente" | "administrador";
  estadoCuenta: "pendiente" | "activa" | "suspendida";
  plan: string | null;
  suscripcion: EstadoSuscripcionAdmin | null;
  creado: Date;
}

export interface PaginaUsuarios {
  total: number;
  pagina: number;
  porPagina: number;
  usuarios: FilaUsuario[];
}

export interface ProyectoAdmin {
  id: string;
  nombre: string;
  subdominio: string;
  /** Estado del despliegue activo; `null` si nunca quedó uno activo. */
  despliegue: string | null;
}

export interface PagoAdmin {
  id: string;
  fecha: Date;
  plan: string;
  vigenciaDias: number;
  monto: number;
  moneda: string;
  estado: "aprobado" | "rechazado";
}

/** Panel de detalle de 25. */
export interface DetalleUsuario extends FilaUsuario {
  ultimoAcceso: Date | null;
  vence: Date | null;
  /** Desde cuándo la suscripción está en su estado («Suspendida desde 21 sep»). */
  suscripcionDesde: Date | null;
  suspension: { desde: Date | null; motivo: string | null; contenedoresDetenidos: number } | null;
  proyectos: ProyectoAdmin[];
  pagos: PagoAdmin[];
}

/** Últimos pagos que muestra el panel de detalle. */
export const PAGOS_EN_DETALLE = 10;

function textoOpcional(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const limpio = valor.trim().toLowerCase();
  return limpio || null;
}

/** `?correo=&suscripcion=&pagina=` de `GET /admin/usuarios`. */
export function validarFiltroUsuarios(consulta: unknown): FiltroUsuarios {
  const { correo, suscripcion, pagina } = (consulta ?? {}) as Record<string, unknown>;
  const estado = textoOpcional(suscripcion);
  if (estado !== null && !ESTADOS_SUSCRIPCION.includes(estado as EstadoSuscripcionAdmin)) {
    throw new ConsultaInvalida(`Estado de suscripción desconocido: ${estado}`);
  }
  const numero = pagina === undefined || pagina === "" ? 1 : Number(pagina);
  if (!Number.isInteger(numero) || numero < 1) throw new ConsultaInvalida("La página debe ser un entero desde 1.");
  return { correo: textoOpcional(correo), suscripcion: estado as EstadoSuscripcionAdmin | null, pagina: numero };
}

/** Contenedores que M5 detuvo: proyectos cuyo despliegue activo quedó Detenido. */
export function contenedoresDetenidos(proyectos: ProyectoAdmin[]): number {
  return proyectos.filter((p) => p.despliegue === "detenido").length;
}
