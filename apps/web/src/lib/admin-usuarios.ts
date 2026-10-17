/**
 * Lógica pura de las pantallas 25 y 25b (M9-01, M9-02): tipos del contrato de
 * `/admin/usuarios`, armado de la consulta y textos del panel. Sin imports de ejecución
 * para probarla con `node --test`.
 */
import type { EstadoDespliegue } from "./proyectos";
import type { EstadoSuscripcion } from "./suscripcion";

export type RolCuenta = "cliente" | "administrador";
export type EstadoCuenta = "pendiente" | "activa" | "suspendida";

/** Una fila de `GET /admin/usuarios`. Fechas en ISO. */
export interface FilaUsuario {
  id: string;
  correo: string;
  nombre: string;
  rol: RolCuenta;
  estadoCuenta: EstadoCuenta;
  plan: string | null;
  suscripcion: EstadoSuscripcion | null;
  creado: string;
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
  despliegue: EstadoDespliegue | null;
}

export interface PagoAdmin {
  id: string;
  fecha: string;
  plan: string;
  vigenciaDias: number;
  monto: number;
  moneda: string;
  estado: "aprobado" | "rechazado";
}

/** `GET /admin/usuarios/:id`. */
export interface DetalleUsuario extends FilaUsuario {
  ultimoAcceso: string | null;
  vence: string | null;
  suscripcionDesde: string | null;
  suspension: { desde: string | null; motivo: string | null; contenedoresDetenidos: number } | null;
  proyectos: ProyectoAdmin[];
  pagos: PagoAdmin[];
}

export interface MotivoSuspension {
  clave: string;
  texto: string;
}

export type FiltroSuscripcion = EstadoSuscripcion | "todas";

export interface FiltroUsuarios {
  correo: string;
  suscripcion: FiltroSuscripcion;
  pagina: number;
}

export const RUTA_ADMIN_USUARIOS = "/admin/usuarios";
export const FILTRO_INICIAL: FiltroUsuarios = { correo: "", suscripcion: "todas", pagina: 1 };
export const DETALLE_MAXIMO = 500;

/** Opciones del filtro «Suscripción: …» en el orden del ciclo §4.4. */
export const OPCIONES_SUSCRIPCION: { valor: FiltroSuscripcion; texto: string }[] = [
  { valor: "todas", texto: "Todas" },
  { valor: "activa", texto: "Activa" },
  { valor: "por-vencer", texto: "Por vencer" },
  { valor: "vencida", texto: "Vencida" },
  { valor: "suspendida", texto: "Suspendida" },
  { valor: "cancelada", texto: "Cancelada" },
];

/** `/admin/usuarios?correo=tiendademo&suscripcion=vencida&pagina=2`; omite lo que no filtra. */
export function consultaUsuarios({ correo, suscripcion, pagina }: FiltroUsuarios): string {
  const parametros = new URLSearchParams();
  const texto = correo.trim().toLowerCase();
  if (texto) parametros.set("correo", texto);
  if (suscripcion !== "todas") parametros.set("suscripcion", suscripcion);
  if (pagina > 1) parametros.set("pagina", String(pagina));
  const consulta = parametros.toString();
  return consulta ? `${RUTA_ADMIN_USUARIOS}?${consulta}` : RUTA_ADMIN_USUARIOS;
}

export function totalPaginas({ total, porPagina }: Pick<PaginaUsuarios, "total" | "porPagina">): number {
  return Math.max(1, Math.ceil(total / porPagina));
}

/** «1 282» (miles con espacio fino, como el diseño). */
export function textoTotal(total: number): string {
  return String(total).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** «21 sep». En UTC, como el resto de fechas de cobro. */
export function diaMes(iso: string): string {
  const fecha = new Date(iso);
  return `${String(fecha.getUTCDate()).padStart(2, "0")} ${MESES[fecha.getUTCMonth()]}`;
}

/** «03 sep 2026» (columna Alta y fechas de pago). */
export function fechaAdmin(iso: string): string {
  return `${diaMes(iso)} ${new Date(iso).getUTCFullYear()}`;
}

const INICIALES = 2;

/** «MR» para María Ríos; sin nombre, las dos primeras letras del correo. */
export function inicialesDe(nombre: string, correo: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return correo.slice(0, INICIALES).toUpperCase();
  return palabras
    .slice(0, INICIALES)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const NOMBRE_ROL: Record<RolCuenta, string> = { cliente: "Cliente", administrador: "Administrador" };

export function textoRol(rol: RolCuenta): string {
  return NOMBRE_ROL[rol];
}

const DIA_MS = 24 * 60 * 60 * 1000;
const HORA_MS = 60 * 60 * 1000;
const MINUTO_MS = 60 * 1000;

/** «hace 6 d», «hace 3 h», «hace 12 min», «hace un momento». */
export function haceCuanto(iso: string, ahora: Date): string {
  const diferencia = Math.max(0, ahora.getTime() - new Date(iso).getTime());
  if (diferencia >= DIA_MS) return `hace ${Math.floor(diferencia / DIA_MS)} d`;
  if (diferencia >= HORA_MS) return `hace ${Math.floor(diferencia / HORA_MS)} h`;
  if (diferencia >= MINUTO_MS) return `hace ${Math.floor(diferencia / MINUTO_MS)} min`;
  return "hace un momento";
}

/** «Alta 14 jun 2026 · último acceso hace 6 d». */
export function textoAlta(d: Pick<DetalleUsuario, "creado" | "ultimoAcceso">, ahora: Date): string {
  const acceso = d.ultimoAcceso ? `último acceso ${haceCuanto(d.ultimoAcceso, ahora)}` : "sin accesos";
  return `Alta ${fechaAdmin(d.creado)} · ${acceso}`;
}

/** «desde 21 sep · 3 contenedores detenidos». */
export function textoSuspension(s: NonNullable<DetalleUsuario["suspension"]>): string {
  const contenedores = textoContenedores(s.contenedoresDetenidos);
  return s.desde ? `desde ${diaMes(s.desde)} · ${contenedores}` : contenedores;
}

const SUSCRIPCION_SIN_VIGENCIA: readonly EstadoSuscripcion[] = ["vencida", "suspendida", "cancelada"];

function textoContenedores(n: number): string {
  return n === 1 ? "1 contenedor detenido" : `${n} contenedores detenidos`;
}

/** Junto al estado de la suscripción: «desde 21 sep · 3 contenedores detenidos» o «vence 03 nov 2026». */
export function textoSuscripcionAdmin(d: Pick<DetalleUsuario, "suscripcion" | "suscripcionDesde" | "vence" | "proyectos">): string {
  if (d.suscripcion && SUSCRIPCION_SIN_VIGENCIA.includes(d.suscripcion) && d.suscripcionDesde) {
    const detenidos = d.proyectos.filter((p) => p.despliegue === "detenido").length;
    return detenidos > 0 ? `desde ${diaMes(d.suscripcionDesde)} · ${textoContenedores(detenidos)}` : `desde ${diaMes(d.suscripcionDesde)}`;
  }
  return d.vence ? `vence ${fechaAdmin(d.vence)}` : "sin vencimiento";
}

/** «Plan Pro · 30 días». */
export function conceptoPagoAdmin(p: Pick<PagoAdmin, "plan" | "vigenciaDias">): string {
  return `Plan ${p.plan} · ${p.vigenciaDias} días`;
}

/** Suspender solo se ofrece a clientes que no están suspendidos (la API lo vuelve a validar). */
export function sePuedeSuspender(u: Pick<FilaUsuario, "rol" | "estadoCuenta">): boolean {
  return u.rol === "cliente" && u.estadoCuenta !== "suspendida";
}

/** Lo que 25b manda a `POST /admin/usuarios/:id/suspension`; `null` si falta el motivo. */
export function cuerpoSuspension(motivo: string, detalle: string): { motivo: string; detalle: string | null } | null {
  if (!motivo) return null;
  const texto = detalle.trim();
  return { motivo, detalle: texto ? texto.slice(0, DETALLE_MAXIMO) : null };
}
