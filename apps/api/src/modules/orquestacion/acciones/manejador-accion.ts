import type { AccionContenedor, TipoAccion } from "../dominio/accion-contenedor";

/** Un manejador por tipo de acción (Strategy): una acción nueva es una clase nueva, sin `switch`. */
export abstract class ManejadorAccion {
  abstract readonly tipo: TipoAccion;
  abstract ejecutar(accion: AccionContenedor): Promise<void>;
}

/** Token de Nest con los manejadores que registra el trabajador. */
export const MANEJADORES_ACCION = Symbol("MANEJADORES_ACCION");
