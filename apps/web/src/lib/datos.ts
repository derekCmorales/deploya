/**
 * Pestaña Datos (ficha 18): tipos del contrato `docs/contratos/recursos-datos.md`, el cliente HTTP con
 * `pedir` inyectado y la lógica pura (límites, disco, errores 409, a quién compartir). Sin DOM ni red,
 * para `node --test`; el hook `useDatosProyecto` le pasa `pedirApi`.
 */

import type { EstadoRecursoDatosValor } from "@/components/deploya/estados";

export type TipoRecurso = "postgres" | "redis" | "s3";

export interface ProyectoReferencia {
  id: string;
  nombre: string;
}

export interface VistaRecursoDatos {
  id: string;
  tipo: TipoRecurso;
  nombre: string;
  estado: EstadoRecursoDatosValor;
  detalle: string | null;
  host: string;
  puerto: number;
  urlPublica: string | null;
  esDueno: boolean;
  proyectoDueno: ProyectoReferencia;
  compartidoCon: ProyectoReferencia[];
  usoDiscoMb: number | null;
  limiteDiscoMb: number;
  variablesInyectadas: string[];
  creado: string;
}

export interface LimiteRecursosDatos {
  usados: number;
  /** `null` en autoalojado: sin límite. */
  maximo: number | null;
}

/** `GET /proyectos/:id/datos`. */
export interface ListaRecursosDatos {
  recursos: VistaRecursoDatos[];
  limite: LimiteRecursosDatos;
  tiposDisponibles: TipoRecurso[];
}

/** `GET /proyectos/:id/datos/:recursoId/conexion`: valores reales, solo para copiar. */
export interface ConexionRecurso {
  variables: Record<string, string>;
}

/** Orden fijo de las tarjetas de creación. */
export const TIPOS_RECURSO: readonly TipoRecurso[] = ["postgres", "redis", "s3"];

export const DESCRIPCION_TIPO: Record<TipoRecurso, { nombre: string; descripcion: string }> = {
  postgres: { nombre: "PostgreSQL 17 + pgvector", descripcion: "Base relacional con búsqueda vectorial. Inyecta DATABASE_URL y PG*." },
  redis: { nombre: "Redis 7", descripcion: "Caché y colas en memoria, con persistencia en disco. Inyecta REDIS_URL." },
  s3: { nombre: "Almacenamiento S3", descripcion: "Archivos compatibles con S3, con URL pública. Inyecta S3_*." },
};

/** Desde aquí el uso de disco se avisa (la API mide; nunca corta). */
export const UMBRAL_AVISO_DISCO = 0.9;
const MB_POR_GB = 1024;
const PORCENTAJE = 100;

// ── Cliente HTTP ────────────────────────────────────────────────────────────

export type MetodoHttp = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type Pedir = <T>(ruta: string, opciones?: { metodo?: MetodoHttp; cuerpo?: unknown }) => Promise<T>;

/** Los seis endpoints del contrato. Un doble de `pedir` basta para probarlo. */
export function clienteDatos(pedir: Pedir) {
  const base = (proyectoId: string) => `/proyectos/${encodeURIComponent(proyectoId)}/datos`;
  const recurso = (proyectoId: string, recursoId: string) => `${base(proyectoId)}/${encodeURIComponent(recursoId)}`;
  return {
    listar: (proyectoId: string) => pedir<ListaRecursosDatos>(base(proyectoId)),
    crear: (proyectoId: string, tipo: TipoRecurso) => pedir<VistaRecursoDatos>(base(proyectoId), { metodo: "POST", cuerpo: { tipo } }),
    conexion: (proyectoId: string, recursoId: string) => pedir<ConexionRecurso>(`${recurso(proyectoId, recursoId)}/conexion`),
    compartir: (proyectoId: string, recursoId: string, destinoId: string) =>
      pedir<VistaRecursoDatos>(`${recurso(proyectoId, recursoId)}/compartir`, { metodo: "POST", cuerpo: { proyectoId: destinoId } }),
    dejarDeCompartir: (proyectoId: string, recursoId: string, destinoId: string) =>
      pedir<unknown>(`${recurso(proyectoId, recursoId)}/compartir/${encodeURIComponent(destinoId)}`, { metodo: "DELETE" }),
    eliminar: (proyectoId: string, recursoId: string, confirmacion: TipoRecurso) =>
      pedir<unknown>(recurso(proyectoId, recursoId), { metodo: "DELETE", cuerpo: { confirmacion } }),
  };
}

export type ClienteDatos = ReturnType<typeof clienteDatos>;

// ── Límites y tarjetas de creación ──────────────────────────────────────────

export function limiteAlcanzado(limite: LimiteRecursosDatos): boolean {
  return limite.maximo !== null && limite.usados >= limite.maximo;
}

/** «1 / 3 bases de datos del plan». */
export function textoLimite(limite: LimiteRecursosDatos): string {
  if (limite.maximo === null) return `${limite.usados} ${limite.usados === 1 ? "base de datos" : "bases de datos"} · sin límite`;
  return `${limite.usados} / ${limite.maximo} ${limite.maximo === 1 ? "base de datos" : "bases de datos"} del plan`;
}

export type MotivoNoCrear = "ya-conectado" | "limite" | "no-disponible";

export interface OpcionCrear {
  tipo: TipoRecurso;
  habilitada: boolean;
  motivo: MotivoNoCrear | null;
}

const TEXTO_MOTIVO: Record<MotivoNoCrear, string> = {
  "ya-conectado": "Ya conectado",
  limite: "Límite del plan",
  "no-disponible": "No disponible",
};

export function textoMotivo(motivo: MotivoNoCrear): string {
  return TEXTO_MOTIVO[motivo];
}

/**
 * Una tarjeta por tipo que la API ofrece o que ya está conectado. A lo sumo uno de cada tipo
 * (propio o compartido) para que las variables no choquen; el tope del plan cuenta por cuenta.
 */
export function opcionesCrear(lista: ListaRecursosDatos): OpcionCrear[] {
  const conectados = new Set(lista.recursos.map((r) => r.tipo));
  const ofrecidos = new Set(lista.tiposDisponibles);
  const lleno = limiteAlcanzado(lista.limite);
  return TIPOS_RECURSO.filter((tipo) => ofrecidos.has(tipo) || conectados.has(tipo)).map((tipo) => {
    if (conectados.has(tipo)) return { tipo, habilitada: false, motivo: "ya-conectado" };
    if (lleno) return { tipo, habilitada: false, motivo: "limite" };
    return { tipo, habilitada: true, motivo: null };
  });
}

/** Sondeo cada 3 s mientras algún recurso se esté creando. */
export function hayRecursoCreando(lista: Pick<ListaRecursosDatos, "recursos">): boolean {
  return lista.recursos.some((r) => r.estado === "creando");
}

// ── Formato ─────────────────────────────────────────────────────────────────

/** «512 MB» · «2 GB» · «1.5 GB». */
export function textoMb(mb: number): string {
  if (mb < MB_POR_GB) return `${Math.round(mb)} MB`;
  const gb = mb / MB_POR_GB;
  return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
}

export function textoHost(recurso: Pick<VistaRecursoDatos, "host" | "puerto">): string {
  return `${recurso.host}:${recurso.puerto}`;
}

/** Fracción 0–1 del disco usado; `null` si todavía no hay medición. */
export function fraccionDisco(recurso: Pick<VistaRecursoDatos, "usoDiscoMb" | "limiteDiscoMb">): number | null {
  if (recurso.usoDiscoMb === null || recurso.limiteDiscoMb <= 0) return null;
  return recurso.usoDiscoMb / recurso.limiteDiscoMb;
}

export function discoCercaDelLimite(recurso: Pick<VistaRecursoDatos, "usoDiscoMb" | "limiteDiscoMb">): boolean {
  const fraccion = fraccionDisco(recurso);
  return fraccion !== null && fraccion >= UMBRAL_AVISO_DISCO;
}

/** «El disco está al 93 % de 2 GB». */
export function textoAvisoDisco(recurso: Pick<VistaRecursoDatos, "usoDiscoMb" | "limiteDiscoMb">): string {
  const fraccion = fraccionDisco(recurso) ?? 0;
  return `El disco está al ${Math.round(fraccion * PORCENTAJE)} % de ${textoMb(recurso.limiteDiscoMb)}`;
}

// ── Compartir y eliminar ────────────────────────────────────────────────────

/** Proyectos del usuario a los que todavía se puede conectar el recurso (ni el dueño, ni los ya conectados). */
export function proyectosParaCompartir<T extends ProyectoReferencia>(
  proyectos: readonly T[],
  recurso: Pick<VistaRecursoDatos, "proyectoDueno" | "compartidoCon">,
): T[] {
  const excluidos = new Set([recurso.proyectoDueno.id, ...recurso.compartidoCon.map((p) => p.id)]);
  return proyectos.filter((p) => !excluidos.has(p.id));
}

/** Confirmación escrita del tipo (`postgres`, `redis`, `s3`), como al eliminar un proyecto. */
export function confirmacionRecursoCoincide(tipo: TipoRecurso, escrito: string): boolean {
  return escrito.trim() === tipo;
}

// ── Errores ─────────────────────────────────────────────────────────────────

export type ErrorDatos =
  | { tipo: "limite"; titulo: string; mensaje: string }
  | { tipo: "tipo-conectado"; titulo: string; mensaje: string }
  | { tipo: "bloqueo"; titulo: string; mensaje: string }
  | { tipo: "aviso"; titulo: string; mensaje: string };

/** El contrato usa `LIMITE_RECURSOS_DATOS`; el resto de la API, `kebab-case`. Se aceptan ambos. */
function codigoNormalizado(codigo: string): string {
  return codigo.trim().toUpperCase().replace(/-/g, "_");
}

const BLOQUEOS = new Set(["SUSCRIPCION_BLOQUEADA", "SUSCRIPCION_NO_PERMITE"]);

export function errorDeDatos(codigo: string, mensaje: string): ErrorDatos {
  const normalizado = codigoNormalizado(codigo);
  if (normalizado === "LIMITE_RECURSOS_DATOS") {
    return { tipo: "limite", titulo: "Llegaste al límite de bases de datos de tu plan", mensaje: "Elimina una que no uses o cambia de plan para agregar otra." };
  }
  if (normalizado === "TIPO_YA_CONECTADO") {
    return { tipo: "tipo-conectado", titulo: "Ese proyecto ya tiene una base de ese tipo", mensaje: "Cada proyecto conecta a lo sumo una de cada tipo, propia o compartida, para que las variables no choquen." };
  }
  if (BLOQUEOS.has(normalizado)) return { tipo: "bloqueo", titulo: "Tu suscripción no permite crear bases de datos", mensaje };
  return { tipo: "aviso", titulo: "No pudimos completar la operación", mensaje };
}

// ── Paso Datos del alta (feat/m3-alta-guiada) ──────────────────────────────

/** Variables de nombre corto que inyecta cada tipo (contrato recursos-datos.md § Tipos); las `DEPLOYA_*` no se listan. */
export const VARIABLES_POR_TIPO: Record<TipoRecurso, readonly string[]> = {
  postgres: ["DATABASE_URL", "PGHOST", "PGPORT", "PGUSER", "PGPASSWORD", "PGDATABASE"],
  redis: ["REDIS_URL"],
  s3: ["S3_ENDPOINT", "S3_PUBLIC_ENDPOINT", "S3_ACCESS_KEY", "S3_SECRET_KEY", "S3_BUCKET", "S3_REGION"],
};

/** Lo que llegará solo al contenedor por los recursos elegidos, en el orden fijo de los tipos. */
export function variablesInyectadasPor(tipos: readonly TipoRecurso[]): { tipo: TipoRecurso; claves: readonly string[] }[] {
  return TIPOS_RECURSO.filter((tipo) => tipos.includes(tipo)).map((tipo) => ({ tipo, claves: VARIABLES_POR_TIPO[tipo] }));
}

export interface OpcionAlta {
  tipo: TipoRecurso;
  elegido: boolean;
  /** No se puede marcar: el plan ya no tiene lugar. Uno elegido siempre se puede desmarcar. */
  deshabilitado: boolean;
}

/** Tarjetas del paso Datos: `maximo: null` es sin tope (autoalojado). */
export function opcionesAlta(limite: LimiteRecursosDatos, elegidos: readonly TipoRecurso[]): OpcionAlta[] {
  const lleno = limite.maximo !== null && limite.usados + elegidos.length >= limite.maximo;
  return TIPOS_RECURSO.map((tipo) => {
    const elegido = elegidos.includes(tipo);
    return { tipo, elegido, deshabilitado: !elegido && lleno };
  });
}

/** «Usas 1 de 3 bases de datos del plan · este proyecto agrega 1». */
export function textoLimiteAlta(limite: LimiteRecursosDatos, elegidos: number): string {
  const agrega = elegidos === 0 ? "" : ` · este proyecto agrega ${elegidos}`;
  if (limite.maximo === null) return `Sin límite de bases de datos${agrega}`;
  return `Usas ${limite.usados} de ${limite.maximo} bases de datos del plan${agrega}`;
}

export function alternarTipo(elegidos: readonly TipoRecurso[], tipo: TipoRecurso): TipoRecurso[] {
  return elegidos.includes(tipo) ? elegidos.filter((t) => t !== tipo) : TIPOS_RECURSO.filter((t) => t === tipo || elegidos.includes(t));
}
