import { LimiteRecursosDatos, SuscripcionBloqueada, TipoYaConectado } from "./errores";
import type { TipoRecurso } from "./recurso-datos";

/** Estados de la suscripción (M2, §4.4) tal como los da `cuotaDe`; no son estados del recurso. */
export type EstadoSuscripcionDatos = "activa" | "por-vencer" | "vencida" | "suspendida" | "cancelada";

/** Igual que `PoliticaDespliegue` (M5-03): solo con la suscripción Activa o Por vencer. */
const ESTADOS_QUE_PERMITEN_CREAR: readonly EstadoSuscripcionDatos[] = ["activa", "por-vencer"];

export interface SituacionAlta {
  estadoSuscripcion: EstadoSuscripcionDatos;
  /** Recursos que ya son de la cuenta (los compartidos no cuentan dos veces). */
  usados: number;
  maximo: number;
  /** Tipos ya conectados al proyecto, propios o compartidos. */
  tiposConectados: readonly TipoRecurso[];
  tipo: TipoRecurso;
}

/**
 * PoliticaRecursosDatos (Specification pura): primero la suscripción, luego el tope del plan y por
 * último que el proyecto no tenga ya uno de ese tipo (así las variables inyectadas no chocan).
 */
export function verificarAlta(situacion: SituacionAlta): void {
  if (!ESTADOS_QUE_PERMITEN_CREAR.includes(situacion.estadoSuscripcion)) throw new SuscripcionBloqueada(situacion.estadoSuscripcion);
  if (situacion.usados >= situacion.maximo) throw new LimiteRecursosDatos(situacion.maximo);
  verificarTipoLibre(situacion.tiposConectados, situacion.tipo);
}

export interface SituacionAltaInicial {
  estadoSuscripcion: EstadoSuscripcionDatos;
  usados: number;
  maximo: number;
  /** Lo que pide el alta del proyecto (feat/m3-alta-guiada), antes de que el proyecto exista. */
  tipos: readonly TipoRecurso[];
}

/**
 * Mismas reglas que `verificarAlta`, para varios recursos de un proyecto que todavía no existe:
 * todos deben caber en el plan y no repetir tipo.
 */
export function verificarAltaInicial(situacion: SituacionAltaInicial): void {
  if (situacion.tipos.length === 0) return;
  if (!ESTADOS_QUE_PERMITEN_CREAR.includes(situacion.estadoSuscripcion)) throw new SuscripcionBloqueada(situacion.estadoSuscripcion);
  if (situacion.usados + situacion.tipos.length > situacion.maximo) throw new LimiteRecursosDatos(situacion.maximo);
  situacion.tipos.forEach((tipo, indice) => verificarTipoLibre(situacion.tipos.slice(0, indice), tipo));
}

/** A lo sumo un recurso de cada tipo por proyecto, propio o compartido. */
export function verificarTipoLibre(tiposConectados: readonly TipoRecurso[], tipo: TipoRecurso): void {
  if (tiposConectados.includes(tipo)) throw new TipoYaConectado(tipo);
}

/** Los tipos que el proyecto todavía puede agregar (la web pinta una tarjeta por cada uno). */
export function tiposDisponibles(todos: readonly TipoRecurso[], tiposConectados: readonly TipoRecurso[]): TipoRecurso[] {
  return todos.filter((tipo) => !tiposConectados.includes(tipo));
}
