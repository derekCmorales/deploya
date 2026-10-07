import { Inject, Injectable } from "@nestjs/common";
import type { AccionContenedor, TipoAccion } from "../dominio/accion-contenedor";
import { MANEJADORES_ACCION, ManejadorAccion } from "./manejador-accion";

export class AccionDesconocida extends Error {
  constructor(tipo: string) {
    super(`No hay manejador para la acción ${tipo}`);
    this.name = "AccionDesconocida";
  }
}

/** Consumidor de la cola `operacion` en el trabajador: entrega cada comando a su manejador. */
@Injectable()
export class AccionesContenedorService {
  private readonly porTipo: ReadonlyMap<TipoAccion, ManejadorAccion>;

  constructor(@Inject(MANEJADORES_ACCION) manejadores: ManejadorAccion[]) {
    this.porTipo = new Map(manejadores.map((manejador) => [manejador.tipo, manejador]));
  }

  async ejecutar(accion: AccionContenedor): Promise<void> {
    const manejador = this.porTipo.get(accion.tipo);
    if (!manejador) throw new AccionDesconocida(accion.tipo);
    await manejador.ejecutar(accion);
  }
}
