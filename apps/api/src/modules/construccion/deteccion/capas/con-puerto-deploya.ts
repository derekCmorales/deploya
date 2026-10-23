import { PUERTO_RECETAS } from "../deteccion.constantes";
import { DecoradorDockerfile } from "./decorador-dockerfile";

/** Toda receta escucha en `PORT=8080` (ADR 0003). */
export class ConPuertoDeploya extends DecoradorDockerfile {
  instrucciones(): readonly string[] {
    return [...super.instrucciones(), `ENV PORT=${PUERTO_RECETAS}`, `EXPOSE ${PUERTO_RECETAS}`];
  }

  descripcion(): string {
    return `${super.descripcion()} · puerto ${PUERTO_RECETAS}`;
  }
}
