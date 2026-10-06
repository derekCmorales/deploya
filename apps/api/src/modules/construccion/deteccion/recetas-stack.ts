import { RecetaDockerfile } from "./recetas/receta-dockerfile";
import { RecetaEstatica } from "./recetas/receta-estatica";
import { RecetaGo } from "./recetas/receta-go";
import { RecetaNode } from "./recetas/receta-node";
import { RecetaPython } from "./recetas/receta-python";
import type { RecetaStack } from "./receta-stack";

/** Token de Nest con las recetas en el orden en que se prueban. */
export const RECETAS_STACK = Symbol("RECETAS_STACK");

/** El orden vive solo aquí: el Dockerfile propio manda y el sitio estático va al final. */
export function recetasEnOrden(): RecetaStack[] {
  return [new RecetaDockerfile(), new RecetaNode(), new RecetaPython(), new RecetaGo(), new RecetaEstatica()];
}
