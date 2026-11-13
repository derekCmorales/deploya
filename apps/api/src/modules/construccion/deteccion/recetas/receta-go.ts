import { PUERTO_RECETAS, VERSION_GO } from "../deteccion.constantes";
import { existe, type MapaArchivos } from "../mapa-archivos";
import { plantillaGo } from "../plantillas";
import { RecetaStack, SIN_OPCIONES, type DescripcionReceta, type OpcionesReceta } from "../receta-stack";

const GO_MOD = "go.mod";

/** `go.mod` → binario estático sobre distroless sin root. */
export class RecetaGo extends RecetaStack {
  readonly receta = "go" as const;
  readonly nombre = `Go ${VERSION_GO}`;
  readonly archivosQueLee = [GO_MOD];
  override readonly aplicaComandoConstruccion = true;

  reconoce(archivos: MapaArchivos): boolean {
    return existe(archivos, GO_MOD);
  }

  describir(): DescripcionReceta {
    return { descripcion: `${this.nombre} · binario estático`, evidencia: [GO_MOD] };
  }

  dockerfile(_archivos: MapaArchivos, opciones: OpcionesReceta = SIN_OPCIONES): string {
    return plantillaGo(opciones.comandoConstruccion);
  }

  puertoSugerido(): number {
    return PUERTO_RECETAS;
  }
}
