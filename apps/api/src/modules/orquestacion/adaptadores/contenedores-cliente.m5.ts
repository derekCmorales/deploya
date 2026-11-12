import { Injectable } from "@nestjs/common";
import { DatosService } from "../../datos/datos.service";
import { AccionesProyectoService } from "../acciones/acciones-proyecto.service";
import type { ResultadoMasivo } from "../dominio/accion-contenedor";
import { ContenedoresClientePuerto } from "../puertos/contenedores-cliente.puerto";

/**
 * Adapter de `ContenedoresClientePuerto` sobre las Facades de M5 y de los recursos de datos: al
 * suspender se detienen las apps y sus bases (el volumen queda intacto); al reanudar, arrancan las dos.
 * `encolados` suma los trabajos de ambas colas.
 */
@Injectable()
export class ContenedoresClienteM5 extends ContenedoresClientePuerto {
  constructor(
    private readonly acciones: AccionesProyectoService,
    private readonly datos: DatosService,
  ) {
    super();
  }

  async detenerTodos(usuarioId: string): Promise<ResultadoMasivo> {
    const [apps, datos] = await Promise.all([this.acciones.detenerTodosDe(usuarioId), this.datos.detenerTodosDe(usuarioId)]);
    return { encolados: apps.encolados + datos.encolados };
  }

  async reanudarTodos(usuarioId: string): Promise<ResultadoMasivo> {
    const [apps, datos] = await Promise.all([this.acciones.reanudarTodosDe(usuarioId), this.datos.reanudarTodosDe(usuarioId)]);
    return { encolados: apps.encolados + datos.encolados };
  }
}
