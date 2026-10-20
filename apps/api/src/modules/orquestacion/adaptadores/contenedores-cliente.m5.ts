import { Injectable } from "@nestjs/common";
import { AccionesProyectoService } from "../acciones/acciones-proyecto.service";
import type { ResultadoMasivo } from "../dominio/accion-contenedor";
import { ContenedoresClientePuerto } from "../puertos/contenedores-cliente.puerto";

/** Adapter de `ContenedoresClientePuerto` sobre la Facade de M5: delega y no decide nada. */
@Injectable()
export class ContenedoresClienteM5 extends ContenedoresClientePuerto {
  constructor(private readonly acciones: AccionesProyectoService) {
    super();
  }

  detenerTodos(usuarioId: string): Promise<ResultadoMasivo> {
    return this.acciones.detenerTodosDe(usuarioId);
  }

  reanudarTodos(usuarioId: string): Promise<ResultadoMasivo> {
    return this.acciones.reanudarTodosDe(usuarioId);
  }
}
