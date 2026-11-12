/**
 * Lógica pura de la pantalla 00 · Inicio (el panel al entrar) y de a dónde lleva la raíz de la app.
 * Sin imports de ejecución para probarla con `node --test`.
 */
import type { EstadoDespliegue, ListaProyectos, ProyectoEnLista, ResumenDespliegue } from "./proyectos";
import type { ModoInstalacion } from "./instalacion";

export const RUTA_INICIO = "/";
export const RUTA_INGRESAR = "/ingresar";
export const RUTA_NUEVO_PROYECTO = "/projects/nuevo";

/** Cuántos despliegues muestra «Actividad reciente». */
export const MAXIMO_ACTIVIDAD = 5;
/** Cuántos proyectos muestra «Tus proyectos» antes de «Ver todos». */
export const MAXIMO_PROYECTOS_INICIO = 6;

/**
 * Raíz de la app sin sesión: en la nube, la landing pública (si está configurada); en autoalojado
 * o sin landing, directo a iniciar sesión. Solo URLs `https://` o `http://` absolutas cuentan.
 */
export function destinoRaizSinSesion(modo: ModoInstalacion, urlLanding: string | undefined): string {
  if (modo === "nube" && urlLanding && /^https?:\/\/[^/]/.test(urlLanding)) return urlLanding;
  return RUTA_INGRESAR;
}

/** El logo lleva a la landing a quien no tiene sesión en la nube; con sesión, al panel. */
export function destinoMarca(conSesion: boolean, modo: ModoInstalacion, urlLanding: string | undefined): string {
  return conSesion ? RUTA_INICIO : destinoRaizSinSesion(modo, urlLanding);
}

/** «Hola, Derek» con el primer nombre; «Hola» si no hay nombre. */
export function saludo(nombre: string | null | undefined): string {
  const primero = (nombre ?? "").trim().split(/\s+/)[0];
  return primero ? `Hola, ${primero}` : "Hola";
}

export type GrupoEstado = "en-linea" | "en-curso" | "con-fallo" | "sin-desplegar" | "detenido";

const GRUPO_POR_ESTADO: Record<EstadoDespliegue, GrupoEstado> = {
  saludable: "en-linea",
  encolado: "en-curso",
  construyendo: "en-curso",
  aprovisionando: "en-curso",
  publicando: "en-curso",
  revirtiendo: "en-curso",
  fallido: "con-fallo",
  cancelado: "detenido",
  detenido: "detenido",
};

export function grupoDeProyecto(proyecto: Pick<ProyectoEnLista, "ultimoDespliegue">): GrupoEstado {
  return proyecto.ultimoDespliegue ? GRUPO_POR_ESTADO[proyecto.ultimoDespliegue.estado] : "sin-desplegar";
}

export type ResumenEstados = Record<GrupoEstado, number>;

/** Cuántos proyectos hay en línea, en curso, con fallo… según su último despliegue. */
export function resumenEstados(lista: Pick<ListaProyectos, "proyectos">): ResumenEstados {
  const resumen: ResumenEstados = { "en-linea": 0, "en-curso": 0, "con-fallo": 0, "sin-desplegar": 0, detenido: 0 };
  for (const p of lista.proyectos) resumen[grupoDeProyecto(p)] += 1;
  return resumen;
}

/** «2 en línea · 1 en curso · 1 con fallo»; omite los ceros. Vacío si no hay nada desplegado. */
export function textoResumenEstados(resumen: ResumenEstados): string {
  const partes: [GrupoEstado, string][] = [
    ["en-linea", "en línea"],
    ["en-curso", "en curso"],
    ["con-fallo", "con fallo"],
    ["detenido", resumen.detenido === 1 ? "detenido" : "detenidos"],
    ["sin-desplegar", "sin desplegar"],
  ];
  return partes
    .filter(([grupo]) => resumen[grupo] > 0)
    .map(([grupo, texto]) => `${resumen[grupo]} ${texto}`)
    .join(" · ");
}

export interface ActividadReciente {
  proyectoId: string;
  proyecto: string;
  subdominio: string;
  despliegue: ResumenDespliegue;
}

/** Último despliegue de cada proyecto, del más nuevo al más viejo, hasta `maximo`. */
export function actividadReciente(lista: Pick<ListaProyectos, "proyectos">, maximo = MAXIMO_ACTIVIDAD): ActividadReciente[] {
  return lista.proyectos
    .filter((p): p is ProyectoEnLista & { ultimoDespliegue: ResumenDespliegue } => p.ultimoDespliegue !== null)
    .map((p) => ({ proyectoId: p.id, proyecto: p.nombre, subdominio: p.subdominio, despliegue: p.ultimoDespliegue }))
    .sort((a, b) => new Date(b.despliegue.creado).getTime() - new Date(a.despliegue.creado).getTime())
    .slice(0, maximo);
}

/** Proyectos para el panel: primero lo que pide atención (en curso, con fallo), luego el resto por nombre. */
export function proyectosParaInicio<T extends Pick<ProyectoEnLista, "nombre" | "ultimoDespliegue">>(
  proyectos: readonly T[],
  maximo = MAXIMO_PROYECTOS_INICIO,
): T[] {
  const prioridad: Record<GrupoEstado, number> = { "en-curso": 0, "con-fallo": 1, "en-linea": 2, detenido: 3, "sin-desplegar": 4 };
  return [...proyectos]
    .sort((a, b) => prioridad[grupoDeProyecto(a)] - prioridad[grupoDeProyecto(b)] || a.nombre.localeCompare(b.nombre, "es"))
    .slice(0, maximo);
}
