import { DatosSolicitudInvalidos } from "./errores";
import { esTipoRecurso, TIPOS_RECURSO, type TipoRecurso } from "./recurso-datos";

type Cuerpo = Record<string, unknown>;

function comoObjeto(cuerpo: unknown): Cuerpo {
  if (!cuerpo || typeof cuerpo !== "object") throw new DatosSolicitudInvalidos("La solicitud no trae datos.");
  return cuerpo as Cuerpo;
}

/** Cuerpo de `POST /proyectos/:id/datos`: `{ tipo }`. */
export function tipoSolicitado(cuerpo: unknown): TipoRecurso {
  const { tipo } = comoObjeto(cuerpo);
  if (!esTipoRecurso(tipo)) throw new DatosSolicitudInvalidos(`El tipo debe ser ${TIPOS_RECURSO.join(", ")}.`);
  return tipo;
}

/** Cuerpo de `POST …/compartir`: `{ proyectoId }`. */
export function destinoSolicitado(cuerpo: unknown): string {
  const { proyectoId } = comoObjeto(cuerpo);
  if (typeof proyectoId !== "string" || !proyectoId.trim()) throw new DatosSolicitudInvalidos("Falta el proyecto con el que compartir.");
  return proyectoId.trim();
}

/** Cuerpo de `DELETE …/:recursoId`: `{ confirmacion }` (el tipo escrito). */
export function confirmacionSolicitada(cuerpo: unknown): string {
  const { confirmacion } = comoObjeto(cuerpo);
  return typeof confirmacion === "string" ? confirmacion : "";
}
