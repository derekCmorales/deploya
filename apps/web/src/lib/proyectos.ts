/**
 * Lógica pura de las pantallas de proyectos (10, 10b, 11a, 11d, 11e). Sin imports
 * de ejecución para poder probarla con `node --test`.
 */

export type EstadoDespliegue =
  | "encolado"
  | "construyendo"
  | "aprovisionando"
  | "publicando"
  | "saludable"
  | "fallido"
  | "cancelado"
  | "detenido";

export type EstadoEtapa = "pendiente" | "en-curso" | "completada" | "fallida" | "omitida";

export interface EtapaDespliegue {
  nombre: string;
  estado: EstadoEtapa;
  duracionMs: number | null;
}

/** `ultimoDespliegue` de `GET /proyectos` (contrato de despliegues v1). */
export interface ResumenDespliegue {
  id: string;
  numero: number;
  estado: EstadoDespliegue;
  etapas: EtapaDespliegue[];
  creado: string;
}

export interface ProyectoEnLista {
  id: string;
  nombre: string;
  subdominio: string;
  urlRepositorio: string;
  rama: string;
  rutaDockerfile: string;
  puertoInterno: number;
  creado: string;
  ultimoDespliegue: ResumenDespliegue | null;
}

export interface PlanProyectos {
  nombre: string;
  cpus: number;
  memoriaMb: number;
}

export interface ListaProyectos {
  proyectos: ProyectoEnLista[];
  usados: number;
  maximo: number;
  plan: PlanProyectos;
}

export interface ValidacionRepositorio {
  accesible: true;
  urlNormalizada: string;
  repositorio: string;
  rama: string;
  ramas: string[];
  commit: { sha: string; mensaje: string; autor: string; fecha: string };
  dockerfile: string | null;
  puerto: number;
  deteccion?: { receta: string; nombre: string; descripcion: string };
}

/** `GET /despliegues/:id` y la consulta por número (10, 12, 12b, 12c). */
export interface VistaDespliegue {
  id: string;
  numero: number;
  proyectoId?: string;
  estado: EstadoDespliegue;
  disparador?: string;
  commit: { sha: string; mensaje: string; rama: string; autor: string } | null;
  url: string | null;
  imagen?: { numero: number; digest: string; tamanoBytes: number; receta: string | null } | null;
  recursos?: { cpus: number; memoriaMb: number } | null;
  codigoSalida?: number | null;
  motivoFallo?: string | null;
  creado?: string;
  terminado?: string | null;
  etapas: EtapaDespliegue[];
}

export const INTERVALO_SONDEO_MS = 3000;
export const LONGITUD_SHA_CORTO = 7;
const LONGITUD_MAX_SUBDOMINIO = 63;
const MEGAS_POR_GIGA = 1024;
const TERMINADOS: readonly EstadoDespliegue[] = ["saludable", "fallido", "cancelado", "detenido"];

/** `¿Sigue en curso?`: el sondeo de la lista y del detalle se detiene cuando todo terminó. */
export function despliegueEnCurso(estado: EstadoDespliegue): boolean {
  return !TERMINADOS.includes(estado);
}

export function algunoEnCurso(lista: Pick<ListaProyectos, "proyectos">): boolean {
  return lista.proyectos.some((p) => p.ultimoDespliegue !== null && despliegueEnCurso(p.ultimoDespliegue.estado));
}

export function puedeCrearProyecto(lista: Pick<ListaProyectos, "usados" | "maximo">): boolean {
  return lista.usados < lista.maximo;
}

/** 19b: el botón «Eliminar» solo se habilita con el nombre exacto del proyecto (sin espacios de más). */
export function confirmacionCoincide(nombre: string, escrito: string): boolean {
  return escrito.trim() === nombre;
}

/** «0 de 1 proyecto en Sandbox» · «2 de 3 proyectos en Starter». */
export function contadorProyectos(lista: Pick<ListaProyectos, "usados" | "maximo" | "plan">): string {
  return `${cuenta(lista)} en ${lista.plan.nombre}`;
}

/** Subtítulo de 10b («Plan Sandbox · 0 de 1 proyecto») y de 10 («Plan Starter · un contenedor por proyecto»). */
export function subtituloProyectos(lista: Pick<ListaProyectos, "proyectos" | "usados" | "maximo" | "plan">): string {
  const detalle = lista.proyectos.length === 0 ? cuenta(lista) : "un contenedor por proyecto";
  return `Plan ${lista.plan.nombre} · ${detalle}`;
}

function cuenta({ usados, maximo }: Pick<ListaProyectos, "usados" | "maximo">): string {
  return `${usados} de ${maximo} ${maximo === 1 ? "proyecto" : "proyectos"}`;
}

/** «0.25 vCPU · 256 MB» · «1 vCPU · 1 GB». */
export function recursosPlan(plan: Pick<PlanProyectos, "cpus" | "memoriaMb">): string {
  const memoria = plan.memoriaMb >= MEGAS_POR_GIGA ? `${plan.memoriaMb / MEGAS_POR_GIGA} GB` : `${plan.memoriaMb} MB`;
  return `${plan.cpus} vCPU · ${memoria}`;
}

export function filtrarProyectos<T extends Pick<ProyectoEnLista, "nombre" | "subdominio">>(proyectos: T[], busqueda: string): T[] {
  const texto = normalizar(busqueda);
  if (!texto) return proyectos;
  return proyectos.filter((p) => normalizar(p.nombre).includes(texto) || p.subdominio.includes(texto));
}

/** Misma regla que la API (`subdominioDesdeNombre`): la web la muestra mientras se escribe. */
export function subdominioDesdeNombre(nombre: string): string {
  return normalizar(nombre)
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, LONGITUD_MAX_SUBDOMINIO)
    .replace(/^-+|-+$/g, "");
}

const PUERTO_MINIMO = 1;
const PUERTO_MAXIMO = 65535;

export function puertoValido(texto: string): boolean {
  const puerto = Number(texto);
  return /^\d+$/.test(texto.trim()) && puerto >= PUERTO_MINIMO && puerto <= PUERTO_MAXIMO;
}

export function urlProyecto(subdominio: string, dominio: string, esquema: string): string {
  return `${esquema}://${subdominio}.${dominio}`;
}

/** «https://github.com/tienda-demo/api-tienda» → «tienda-demo/api-tienda». */
export function repositorioCorto(url: string): string {
  return url.replace(/^https:\/\/github\.com\//, "");
}

/** Nombre sugerido para el proyecto: el del repositorio. */
export function nombreSugerido(url: string): string {
  return repositorioCorto(url).split("/")[1] ?? "";
}

export function shaCorto(sha: string): string {
  return sha.slice(0, LONGITUD_SHA_CORTO);
}

/** Tarjeta de 11a: Dockerfile propio o «Stack detectado: Node.js 22 · receta Deploya». */
export function tituloDeteccion(validacion: Pick<ValidacionRepositorio, "dockerfile" | "deteccion">): { titulo: string; detalle: string } {
  const deteccion = validacion.deteccion;
  if (deteccion && deteccion.receta !== "dockerfile") {
    return { titulo: `Stack detectado: ${deteccion.nombre} · receta Deploya`, detalle: deteccion.descripcion };
  }
  return { titulo: "Dockerfile encontrado", detalle: validacion.dockerfile ? resumenDockerfile(validacion.dockerfile) : "Dockerfile en la raíz" };
}

/** Línea «Construcción» de 11d. */
export function textoConstruccion(validacion: Pick<ValidacionRepositorio, "deteccion">): string {
  if (validacion.deteccion && validacion.deteccion.receta !== "dockerfile") return validacion.deteccion.descripcion;
  return "docker build · /Dockerfile";
}

export interface BloqueoDespliegue {
  titulo: string;
  accion: "Renovar" | "Cambiar de plan";
}

/** Banner de 11d y 17. `null` si el código no es un bloqueo de M5. */
export function bloqueoDespliegue(codigo: string, mensaje: string): BloqueoDespliegue | null {
  if (codigo === "suscripcion-no-permite") return { titulo: mensaje, accion: "Renovar" };
  if (codigo === "cuota-construcciones-agotada") return { titulo: "Usaste las construcciones de tu plan este mes", accion: "Cambiar de plan" };
  return null;
}

/** «/Dockerfile · FROM node:20-alpine · EXPOSE 8080». */
export function resumenDockerfile(dockerfile: string): string {
  const instrucciones = dockerfile
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^(FROM|EXPOSE)\s/i.test(l));
  const desde = instrucciones.find((l) => /^FROM/i.test(l));
  const expone = instrucciones.find((l) => /^EXPOSE/i.test(l));
  return ["/Dockerfile", desde, expone].filter(Boolean).join(" · ");
}

/** Estado de cada etapa para `RielEtapas`; sin despliegue, las cinco pendientes. */
export function etapasDelRiel(despliegue: Pick<ResumenDespliegue, "etapas"> | null): EstadoEtapa[] {
  if (!despliegue) return ["pendiente", "pendiente", "pendiente", "pendiente", "pendiente"];
  return despliegue.etapas.map((e) => e.estado);
}

/** Texto bajo cada segmento del riel grande (12, 12b, 12c). */
export function textoEtapa(nombre: string, estado: string, duracionMs: number | null, todoBien: boolean): string {
  if (estado === "pendiente" || estado === "omitida") return "Pendiente";
  if (estado === "en-curso") return "En curso";
  if (estado === "fallida") return duracionMs === null ? "Falló" : `Falló · ${duracionEtapa(duracionMs)}`;
  if (todoBien && nombre === "operacion") return "estable";
  return duracionEtapa(duracionMs);
}

/** «1.4 s» · «01:10» · «—». */
export function duracionEtapa(duracionMs: number | null): string {
  if (duracionMs === null) return "—";
  const segundos = duracionMs / 1000;
  if (segundos < 60) return `${segundos.toFixed(1)} s`;
  const total = Math.round(segundos);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const MINUTO_MS = 60_000;
const HORA_MS = 60 * MINUTO_MS;
const DIA_MS = 24 * HORA_MS;

/** «hace segundos» · «hace 4 min» · «hace 3 h» · «ayer» · «hace 3 d». */
export function haceCuanto(fechaIso: string, ahora: Date): string {
  const transcurrido = ahora.getTime() - new Date(fechaIso).getTime();
  if (transcurrido < MINUTO_MS) return "hace segundos";
  if (transcurrido < HORA_MS) return `hace ${Math.floor(transcurrido / MINUTO_MS)} min`;
  if (transcurrido < DIA_MS) return `hace ${Math.floor(transcurrido / HORA_MS)} h`;
  const dias = Math.floor(transcurrido / DIA_MS);
  return dias === 1 ? "ayer" : `hace ${dias} d`;
}

/** Cómo pinta el asistente cada `codigo` de error de la API de proyectos (11a / 11e). */
export type ErrorAlta =
  | { tipo: "no-accesible"; estadoHttp: number }
  | { tipo: "sin-dockerfile"; rama: string }
  | { tipo: "stack-no-reconocido"; rama: string; pista: string; mensaje: string }
  | { tipo: "bloqueo"; codigo: string; titulo: string; accion: "Renovar" | "Cambiar de plan"; mensaje: string }
  | { tipo: "campo"; campo: "url" | "rama" | "nombre" | "puerto"; mensaje: string }
  | { tipo: "aviso"; mensaje: string };

const CAMPO_POR_CODIGO: Record<string, "url" | "rama" | "nombre"> = {
  "url-invalida": "url",
  "rama-no-encontrada": "rama",
  "subdominio-en-uso": "nombre",
};

export function errorDeAlta(codigo: string, mensaje: string, detalle: Record<string, unknown>): ErrorAlta {
  if (codigo === "repositorio-no-accesible") return { tipo: "no-accesible", estadoHttp: Number(detalle.estadoHttp) };
  if (codigo === "sin-dockerfile") return { tipo: "sin-dockerfile", rama: String(detalle.rama) };
  if (codigo === "stack-no-reconocido") {
    return { tipo: "stack-no-reconocido", rama: String(detalle.rama), pista: String(detalle.pista ?? ""), mensaje };
  }
  const bloqueo = bloqueoDespliegue(codigo, mensaje);
  if (bloqueo) return { tipo: "bloqueo", codigo, ...bloqueo, mensaje };
  if (codigo === "datos-invalidos" && /puerto/i.test(mensaje)) return { tipo: "campo", campo: "puerto", mensaje };
  if (codigo === "datos-invalidos" && /nombre/i.test(mensaje)) return { tipo: "campo", campo: "nombre", mensaje };
  const campo = CAMPO_POR_CODIGO[codigo];
  return campo ? { tipo: "campo", campo, mensaje } : { tipo: "aviso", mensaje };
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
