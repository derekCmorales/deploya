/**
 * Lógica pura del asistente «Nuevo proyecto» (11a–11d, feat/m3-alta-guiada): el orden de los cinco pasos,
 * a qué paso lleva cada error de la API y el cuerpo de `POST /proyectos`. Sin imports de valor, para
 * `node --test`.
 */

import type { TipoRecurso } from "@/lib/datos";
import type { ErrorAlta } from "@/lib/proyectos";

export const PASOS_ALTA = ["repositorio", "construccion", "datos", "variables", "revisar"] as const;
export type PasoAlta = (typeof PASOS_ALTA)[number];
export const TOTAL_PASOS_ALTA = PASOS_ALTA.length;

/** Columna izquierda (patrón E): título y lo que se define en cada paso. */
export const PASOS_VISIBLES: readonly { titulo: string; detalle: string }[] = [
  { titulo: "Repositorio", detalle: "URL, rama y Dockerfile" },
  { titulo: "Construcción", detalle: "Comandos de build e inicio" },
  { titulo: "Datos", detalle: "PostgreSQL, Redis y S3" },
  { titulo: "Variables", detalle: "Claves cifradas" },
  { titulo: "Revisar", detalle: "Confirmar y desplegar" },
];

export function indicePaso(paso: PasoAlta): number {
  return PASOS_ALTA.indexOf(paso);
}

/** State: siempre hacia adelante de uno en uno; desde Revisar no hay siguiente. */
export function pasoSiguiente(paso: PasoAlta): PasoAlta {
  return PASOS_ALTA[Math.min(indicePaso(paso) + 1, TOTAL_PASOS_ALTA - 1)];
}

export function pasoAnterior(paso: PasoAlta): PasoAlta {
  return PASOS_ALTA[Math.max(indicePaso(paso) - 1, 0)];
}

export function esUltimoPaso(paso: PasoAlta): boolean {
  return indicePaso(paso) === TOTAL_PASOS_ALTA - 1;
}

/** «Paso 2 de 5 · opcional»: Construcción, Datos y Variables se pueden saltar. */
export function textoProgreso(paso: PasoAlta): string {
  const base = `Paso ${indicePaso(paso) + 1} de ${TOTAL_PASOS_ALTA}`;
  return PASOS_OPCIONALES.includes(paso) ? `${base} · opcional` : base;
}

const PASOS_OPCIONALES: readonly PasoAlta[] = ["construccion", "datos", "variables"];

/** Al fallar el alta en Revisar, el asistente vuelve al paso donde se corrige el error. */
export function pasoDeError(error: ErrorAlta): PasoAlta {
  if (error.tipo === "datos") return "datos";
  if (error.tipo === "variables") return "variables";
  if (error.tipo === "campo" && (error.campo === "comandoInicio" || error.campo === "comandoConstruccion")) return "construccion";
  if (error.tipo === "aviso" || error.tipo === "bloqueo") return "revisar";
  return "repositorio";
}

export type RecetaDetectada = "dockerfile" | "node" | "python" | "go" | "estatica";

/** Dónde corre el comando de construcción en cada receta (spec motor-construccion); `null` si no aplica. */
export function pistaComandoConstruccion(receta: string): string | null {
  const pistas: Partial<Record<string, string>> = {
    node: "Reemplaza npm run build. Corre después de instalar dependencias.",
    python: "Corre después de pip install, p. ej. python manage.py collectstatic --noinput.",
    go: "Corre antes de go build, p. ej. go generate ./...",
  };
  return pistas[receta] ?? null;
}

/** Por qué no se ofrece el campo cuando la receta no lo aplica. */
export function motivoSinComandoConstruccion(receta: string): string {
  if (receta === "estatica") return "Un sitio estático se publica tal cual: no hay paso de construcción.";
  return "Tu Dockerfile manda: el build lo definen sus instrucciones RUN.";
}

export interface EntradaAlta {
  url: string;
  rama: string;
  rutaDockerfile: string;
  nombre: string;
  puerto: string;
  comandoInicio: string;
  comandoConstruccion: string;
  /** Solo si la receta lo aplica; si no, el comando no se envía. */
  aplicaComandoConstruccion: boolean;
  datos: readonly TipoRecurso[];
  variables: readonly { clave: string; valor: string }[];
}

/** Cuerpo de `POST /proyectos`: los opcionales vacíos no viajan, así el alta mínima es la de siempre. */
export function cuerpoAlta(entrada: EntradaAlta): Record<string, unknown> {
  const comandoInicio = entrada.comandoInicio.trim();
  const comandoConstruccion = entrada.aplicaComandoConstruccion ? entrada.comandoConstruccion.trim() : "";
  return {
    url: entrada.url,
    rama: entrada.rama,
    rutaDockerfile: entrada.rutaDockerfile,
    nombre: entrada.nombre,
    puerto: Number(entrada.puerto),
    variables: entrada.variables,
    ...(comandoInicio ? { comandoInicio } : {}),
    ...(comandoConstruccion ? { comandoConstruccion } : {}),
    ...(entrada.datos.length > 0 ? { datos: [...entrada.datos] } : {}),
  };
}

export const LARGO_MAXIMO_COMANDO = 512;

/** Misma regla que la API: hasta 512 caracteres y, el de construcción, en una sola línea. */
export function errorComando(texto: string, tipo: "inicio" | "construccion"): string | null {
  if (texto.trim().length > LARGO_MAXIMO_COMANDO) return `El comando admite hasta ${LARGO_MAXIMO_COMANDO} caracteres.`;
  if (tipo === "construccion" && /[\r\n]/.test(texto)) return "El comando de construcción va en una sola línea.";
  if (tipo === "inicio" && comillaAbierta(texto)) return "Falta cerrar una comilla.";
  return null;
}

function comillaAbierta(texto: string): boolean {
  let abierta: string | null = null;
  for (const caracter of texto) {
    if (abierta === null && (caracter === '"' || caracter === "'")) abierta = caracter;
    else if (caracter === abierta) abierta = null;
  }
  return abierta !== null;
}
