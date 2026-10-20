import { Injectable, Logger } from "@nestjs/common";
import { ContenedoresClientePuerto } from "../../orquestacion/puertos/contenedores-cliente.puerto";
import { ContratacionService, type ResultadoContratacion } from "../contratacion.service";
import type { EstadoSuscripcionValor } from "../dominio/suscripcion";
import type { SolicitudContratacion } from "../dominio/tarjeta";
import { mensajeDe } from "./ciclo-suscripcion.service";

/** Estados en los que el ciclo ya detuvo los contenedores del cliente. */
const CON_CONTENEDORES_DETENIDOS: readonly EstadoSuscripcionValor[] = ["suspendida", "cancelada"];

/**
 * Decorator de `ContratacionService.contratar` (M2-05): si el pago se aprueba y la suscripción
 * venía con los contenedores detenidos, pide a M5 que los vuelva a arrancar (pantalla 28: «volvemos
 * a arrancar el último despliegue saludable»). Vive en el módulo del ciclo porque
 * `SuscripcionesModule` no puede importar `OrquestacionModule` (este ya lo importa a él).
 */
@Injectable()
export class ReactivacionService {
  private readonly registro = new Logger(ReactivacionService.name);

  constructor(
    private readonly contratacion: ContratacionService,
    private readonly contenedores: ContenedoresClientePuerto,
  ) {}

  async contratar(usuarioId: string, solicitud: SolicitudContratacion): Promise<ResultadoContratacion> {
    const antes = await this.contratacion.miSuscripcion(usuarioId);
    const resultado = await this.contratacion.contratar(usuarioId, solicitud);
    if (resultado.resultado === "aprobado" && CON_CONTENEDORES_DETENIDOS.includes(antes.estado)) {
      await this.reanudar(usuarioId);
    }
    return resultado;
  }

  /** El pago ya se cobró: si M5 falla al encolar, la renovación queda hecha y se registra el error. */
  private async reanudar(usuarioId: string): Promise<void> {
    try {
      await this.contenedores.reanudarTodos(usuarioId);
    } catch (error) {
      this.registro.error(`No se pudieron reanudar los contenedores de ${usuarioId}: ${mensajeDe(error)}`);
    }
  }
}
