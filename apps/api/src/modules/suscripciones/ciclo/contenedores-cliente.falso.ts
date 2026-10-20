import type { ResultadoMasivo } from "../../orquestacion/dominio/accion-contenedor";
import { ContenedoresClientePuerto } from "../../orquestacion/puertos/contenedores-cliente.puerto";

/** Doble del puerto de M5 para las pruebas de M2 y M9: anota a quién se pidió detener o reanudar. */
export class ContenedoresClienteFalso extends ContenedoresClientePuerto {
  readonly detenidos: string[] = [];
  readonly reanudados: string[] = [];
  private fallo: Error | null = null;

  fallarCon(error: Error): this {
    this.fallo = error;
    return this;
  }

  async detenerTodos(usuarioId: string): Promise<ResultadoMasivo> {
    if (this.fallo) throw this.fallo;
    this.detenidos.push(usuarioId);
    return { encolados: 1 };
  }

  async reanudarTodos(usuarioId: string): Promise<ResultadoMasivo> {
    if (this.fallo) throw this.fallo;
    this.reanudados.push(usuarioId);
    return { encolados: 1 };
  }
}
