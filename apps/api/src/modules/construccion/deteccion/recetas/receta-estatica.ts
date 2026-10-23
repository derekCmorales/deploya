import { PUERTO_RECETAS, UID_NGINX } from "../deteccion.constantes";
import { DockerfileBase } from "../dockerfile-receta";
import { existe, type MapaArchivos } from "../mapa-archivos";
import { plantillaEstatica } from "../plantillas";
import { RecetaStack, type DescripcionReceta } from "../receta-stack";

const INDEX = "index.html";

/** `index.html` en la raíz → nginx sin privilegios en 8080. Es la última receta. */
export class RecetaEstatica extends RecetaStack {
  readonly receta = "estatica" as const;
  readonly nombre = "Sitio estático";
  readonly archivosQueLee = [INDEX];
  /** Su base termina en `USER root` para limpiar el sitio; esta capa la deja sin privilegios. */
  readonly usuarioFinal = String(UID_NGINX);

  reconoce(archivos: MapaArchivos): boolean {
    return existe(archivos, INDEX);
  }

  describir(): DescripcionReceta {
    return { descripcion: `${this.nombre} · nginx sin privilegios`, evidencia: [INDEX] };
  }

  dockerfile(): DockerfileBase {
    return new DockerfileBase(this.nombre, plantillaEstatica());
  }

  puertoSugerido(): number {
    return PUERTO_RECETAS;
  }
}
