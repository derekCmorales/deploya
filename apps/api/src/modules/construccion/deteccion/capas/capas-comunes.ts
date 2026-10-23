import type { DockerfileReceta } from "../dockerfile-receta";
import { ConPuertoDeploya } from "./con-puerto-deploya";
import { ConUsuarioSinPrivilegios } from "./con-usuario-sin-privilegios";

/**
 * Cliente del Decorator en la detección (alta y trabajador): el puerto va siempre y el
 * `USER` final solo si la receta lo declara (Node fija `USER node` dentro de su base).
 */
export function capasComunes(base: DockerfileReceta, usuarioFinal: string | null): DockerfileReceta {
  let dockerfile: DockerfileReceta = new ConPuertoDeploya(base);
  if (usuarioFinal) dockerfile = new ConUsuarioSinPrivilegios(dockerfile, usuarioFinal);
  return dockerfile;
}
