import type { DockerfileReceta } from "../dockerfile-receta";
import { ConEtiqueta } from "./con-etiqueta";

export const ETIQUETA_REVISION = "org.opencontainers.image.revision";
export const ETIQUETA_FUENTE = "org.opencontainers.image.source";
export const ETIQUETA_PROYECTO = "deploya.proyecto";

export interface DatosDespliegue {
  sha: string;
  urlRepositorio: string;
  subdominio: string;
}

/** Cliente del Decorator en el trabajador: el único punto que conoce el commit que se construye. */
export function etiquetasDelDespliegue(dockerfile: DockerfileReceta, datos: DatosDespliegue): DockerfileReceta {
  const conRevision = new ConEtiqueta(dockerfile, ETIQUETA_REVISION, datos.sha);
  const conFuente = new ConEtiqueta(conRevision, ETIQUETA_FUENTE, datos.urlRepositorio);
  return new ConEtiqueta(conFuente, ETIQUETA_PROYECTO, datos.subdominio);
}
