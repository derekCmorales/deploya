import type { ConsultaSalida, LineaSalida } from "../../modules/orquestacion/puertos/contenedor.puerto";
import { SalidaContenedorPuerto } from "../../modules/observabilidad/puertos/salida-contenedor.puerto";

/** Sin trabajador (stub y pruebas): la salida vive en el proceso; `escribir` simula la app (LSP con el real). */
export class SalidaContenedorMemoria extends SalidaContenedorPuerto {
  private readonly salidas = new Map<string, LineaSalida[]>();
  /** Si está, la lectura falla con este error (trabajador que no responde). */
  falla: Error | null = null;

  escribir(contenedorId: string, ...lineas: LineaSalida[]): void {
    this.salidas.set(contenedorId, [...(this.salidas.get(contenedorId) ?? []), ...lineas]);
  }

  async leer(contenedorId: string, { desde, max }: ConsultaSalida): Promise<LineaSalida[]> {
    if (this.falla) throw this.falla;
    return (this.salidas.get(contenedorId) ?? []).filter((l) => !desde || l.marca >= desde).slice(-max);
  }
}
