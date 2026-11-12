import type { TipoRecurso } from "./recurso-datos";

/** Lo que identifica al recurso aunque su fila ya no exista: los nombres se derivan del dueño y el tipo. */
export interface ComandoSobreRecurso {
  recursoId: string;
  tipo: TipoRecurso;
  subdominioDueno: string;
}

/**
 * Comando serializable de la cola `datos` (patrón Command): la API dice qué hacer y el trabajador lo
 * hace con Docker. `eliminar` lleva el dueño y el tipo porque la fila ya se borró.
 */
export type ComandoDatos =
  | { accion: "crear"; recursoId: string }
  | ({ accion: "eliminar" | "detener" | "iniciar" } & ComandoSobreRecurso)
  | ({ accion: "conectar" | "desconectar"; subdominio: string } & ComandoSobreRecurso);

export type AccionDatos = ComandoDatos["accion"];

/** El comando de una acción (distribuye sobre la unión: `eliminar` comparte forma con `detener`). */
export type ComandoDe<A extends AccionDatos> = ComandoDatos extends infer C ? (C extends { accion: infer X } ? (A extends X ? C : never) : never) : never;
