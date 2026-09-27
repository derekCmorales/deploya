import type { ProyectoDesplegable } from "../dominio/despliegue";

/**
 * Lo que el motor lee de un proyecto. El adaptador real envuelve lo que exporte M3
 * (ProyectosService) cuando exista; el motor no lee la tabla Proyecto por su cuenta.
 */
export abstract class ProyectosLecturaPuerto {
  abstract porId(proyectoId: string): Promise<ProyectoDesplegable | null>;
}
