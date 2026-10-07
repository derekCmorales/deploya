import { RUTA_DOCKERFILE, PUERTO_RECETAS } from "../deteccion.constantes";
import { primerExpose } from "../expose";
import { existe, type MapaArchivos } from "../mapa-archivos";
import { RecetaStack, type DescripcionReceta } from "../receta-stack";

/** El `Dockerfile` del repositorio manda siempre: es la primera receta de la lista. */
export class RecetaDockerfile extends RecetaStack {
  readonly receta = "dockerfile" as const;
  readonly nombre = "Dockerfile propio";
  readonly archivosQueLee = [RUTA_DOCKERFILE];

  reconoce(archivos: MapaArchivos): boolean {
    return existe(archivos, RUTA_DOCKERFILE);
  }

  describir(): DescripcionReceta {
    return { descripcion: "Dockerfile en la raíz", evidencia: [RUTA_DOCKERFILE] };
  }

  dockerfile(): null {
    return null;
  }

  puertoSugerido(archivos: MapaArchivos): number {
    return primerExpose(archivos[RUTA_DOCKERFILE] ?? "") ?? PUERTO_RECETAS;
  }
}
