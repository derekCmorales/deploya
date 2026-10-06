import { PUERTO_RECETAS } from "../deteccion.constantes";
import { existe, type MapaArchivos } from "../mapa-archivos";
import { plantillaEstatica } from "../plantillas";
import { RecetaStack, type DescripcionReceta } from "../receta-stack";

const INDEX = "index.html";

/** `index.html` en la raíz → nginx sin privilegios en 8080. Es la última receta. */
export class RecetaEstatica extends RecetaStack {
  readonly receta = "estatica" as const;
  readonly nombre = "Sitio estático";
  readonly archivosQueLee = [INDEX];

  reconoce(archivos: MapaArchivos): boolean {
    return existe(archivos, INDEX);
  }

  describir(): DescripcionReceta {
    return { descripcion: `${this.nombre} · nginx sin privilegios`, evidencia: [INDEX] };
  }

  dockerfile(): string {
    return plantillaEstatica();
  }

  puertoSugerido(): number {
    return PUERTO_RECETAS;
  }
}
