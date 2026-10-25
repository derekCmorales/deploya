/**
 * Lógica pura de la pantalla 32 · Admin · Instalación (SP-18): tipos de `GET /admin/instalacion`
 * (contrato instalacion.md) y los textos de cada bloque. Sin imports de ejecución para `node --test`.
 */
export type EstadoComprobacion = "ok" | "aviso" | "error";
export type PoliticaRegistro = "abierto" | "invitacion" | "cerrado";

export interface Comprobacion {
  id: string;
  estado: EstadoComprobacion;
  detalle: string;
}

export interface InvitacionActiva {
  id: string;
  correo: string;
  vence: string;
}

export interface LimitesInstalacion {
  cpu: number;
  memoriaMb: number;
  proyectosPorUsuario: number | null;
  capacidad: number | null;
  memoriaLibreMb: number | null;
}

export interface EstadoInstalacion {
  dominio: string;
  comprobado: string;
  salud: Comprobacion[];
  version: { instalada: string | null; disponible: string | null };
  registro: { politica: PoliticaRegistro; invitaciones: InvitacionActiva[] };
  limites: LimitesInstalacion;
  respaldo: { ultimo: string | null; tamanoMb: number | null; ruta: string; programa: string; hora: string; conserva: number };
}

export const RUTA_ADMIN_INSTALACION = "/admin/instalacion";

const NOMBRE_COMPROBACION: Record<string, string> = {
  docker: "Docker",
  dns: "Dominio comodín",
  certificado: "Certificado",
  disco: "Disco",
  correo: "Correo",
};

export function nombreComprobacion(id: string): string {
  return NOMBRE_COMPROBACION[id] ?? id;
}

export const OPCIONES_REGISTRO: { valor: PoliticaRegistro; texto: string }[] = [
  { valor: "abierto", texto: "Abierto" },
  { valor: "invitacion", texto: "Con invitación" },
  { valor: "cerrado", texto: "Cerrado" },
];

const TEXTO_REGISTRO: Record<PoliticaRegistro, string> = {
  abierto: "Cualquiera con el enlace de la instalación puede registrarse como Cliente.",
  invitacion: "Solo entra quien tenga una invitación; cada enlace sirve una vez y vence en 7 días.",
  cerrado: "Nadie puede registrarse. Las cuentas existentes siguen entrando.",
};

export function textoRegistro(politica: PoliticaRegistro): string {
  return TEXTO_REGISTRO[politica];
}

export const OPCIONES_CPU = [0.5, 1, 2] as const;
export const OPCIONES_MEMORIA_MB = [512, 1024, 2048] as const;
const MB_POR_GB = 1024;

/** «512 MB», «1 GB», «2 GB». */
export function textoMemoria(mb: number): string {
  return mb >= MB_POR_GB ? `${mb / MB_POR_GB} GB` : `${mb} MB`;
}

export function textoCpu(cpu: number): string {
  return `${cpu} vCPU`;
}

const MINUTO_MS = 60 * 1000;
const HORA_MS = 60 * MINUTO_MS;
const DIA_MS = 24 * HORA_MS;
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** «Comprobado hace 1 min». */
export function textoComprobado(iso: string, ahora: Date): string {
  const minutos = Math.max(1, Math.floor((ahora.getTime() - new Date(iso).getTime()) / MINUTO_MS));
  return minutos < 60 ? `Comprobado hace ${minutos} min` : `Comprobado hace ${Math.floor(minutos / 60)} h`;
}

/** «vence en 6 días», «vence mañana», «vence hoy». */
export function textoVenceInvitacion(iso: string, ahora: Date): string {
  const dias = Math.floor((new Date(iso).getTime() - ahora.getTime()) / DIA_MS);
  if (dias <= 0) return "vence hoy";
  if (dias === 1) return "vence mañana";
  return `vence en ${dias} días`;
}

function hora(fecha: Date): string {
  return `${String(fecha.getUTCHours()).padStart(2, "0")}:${String(fecha.getUTCMinutes()).padStart(2, "0")}`;
}

function mismoDia(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

/** «hoy, 03:00», «ayer, 03:00» o «20 oct 2026, 03:00» (UTC, como el cron del instalador). */
export function textoUltimoRespaldo(iso: string | null, ahora: Date): string {
  if (!iso) return "Todavía no hay respaldos";
  const fecha = new Date(iso);
  if (mismoDia(fecha, ahora)) return `hoy, ${hora(fecha)}`;
  if (mismoDia(fecha, new Date(ahora.getTime() - DIA_MS))) return `ayer, ${hora(fecha)}`;
  return `${String(fecha.getUTCDate()).padStart(2, "0")} ${MESES[fecha.getUTCMonth()]} ${fecha.getUTCFullYear()}, ${hora(fecha)}`;
}

/** «Diario · guarda 7». */
export function textoPrograma({ programa, conserva }: Pick<EstadoInstalacion["respaldo"], "programa" | "conserva">): string {
  return `${programa.charAt(0).toUpperCase()}${programa.slice(1)} · guarda ${conserva}`;
}

/** La fecha que pide `respaldar.sh --restaurar`: «2026-10-20». */
export function fechaRestaurar(iso: string | null): string {
  return (iso ?? new Date(0).toISOString()).slice(0, 10);
}

/** Banner de Límites: «En este servidor caben unos 3 proyectos activos con 1 GB cada uno». */
export function textoCapacidad(l: Pick<LimitesInstalacion, "capacidad" | "memoriaLibreMb">, memoriaMb: number): { titulo: string; texto: string } {
  const aplica = "Aplica en el próximo despliegue de cada proyecto.";
  if (l.capacidad === null || l.memoriaLibreMb === null) {
    return { titulo: "Todavía no sabemos cuánta memoria tiene el servidor", texto: `El trabajador la reporta cada 10 minutos. ${aplica}` };
  }
  const proyectos = l.capacidad === 1 ? "1 proyecto activo" : `unos ${l.capacidad} proyectos activos`;
  return {
    titulo: `En este servidor caben ${proyectos} con ${textoMemoria(memoriaMb)} cada uno`,
    texto: `Quedan ${textoMemoria(Math.floor(l.memoriaLibreMb / MB_POR_GB) * MB_POR_GB)} en total y deploya usa cerca de 1 GB. ${aplica}`,
  };
}

/** «Sin límite» o un entero ≥ 1: lo que manda `PATCH /admin/instalacion/limites`; `undefined` si no es válido. */
export function proyectosDesdeTexto(texto: string): number | null | undefined {
  const limpio = texto.trim();
  if (!limpio || limpio.toLowerCase() === "sin límite") return null;
  const n = Number(limpio);
  return Number.isInteger(n) && n >= 1 ? n : undefined;
}
