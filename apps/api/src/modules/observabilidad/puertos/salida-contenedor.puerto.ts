import type { ConsultaSalida, LineaSalida } from "../../orquestacion/puertos/contenedor.puerto";

/**
 * Lo que M7 lee de la salida de un contenedor (SP-12). La API no llama a Docker (ADR 0002): el
 * adaptador real se lo pide al trabajador, que usa `ContenedorPuerto.bitacora`.
 */
export abstract class SalidaContenedorPuerto {
  abstract leer(contenedorId: string, consulta: ConsultaSalida): Promise<LineaSalida[]>;
}
