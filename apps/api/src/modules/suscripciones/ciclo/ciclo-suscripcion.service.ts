import { Injectable, Logger } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import { AvisosPuerto } from "../../notificaciones";
import { ContenedoresClientePuerto } from "../../orquestacion/puertos/contenedores-cliente.puerto";
import { avisoDeTransicion } from "../dominio/aviso-ciclo";
import { PoliticaCiclo } from "../dominio/politica-ciclo";
import type { EstadoSuscripcionValor, Suscripcion } from "../dominio/suscripcion";
import { RepositorioSuscripciones } from "../puertos/repositorio-suscripciones.puerto";

/** Una fila de `{ cambios }` de `POST /admin/ciclo/ejecutar`. */
export interface CambioCiclo {
  usuarioId: string;
  de: EstadoSuscripcionValor;
  a: EstadoSuscripcionValor;
}

export interface ResultadoCiclo {
  cambios: CambioCiclo[];
}

/**
 * Service Layer del ciclo §4.4 (M2-05): lee las candidatas, pide el salto a `PoliticaCiclo` y lo
 * guarda con su `estadoDesde`. Al pasar a Suspendida avisa a M5 por `ContenedoresClientePuerto`
 * (Observer): si M5 falla, la suscripción queda Suspendida igual y las demás siguen. Al pasar a
 * Por vencer o a Suspendida avisa al titular por `AvisosPuerto` (SP-04): como solo avisa en el
 * salto, correr la tarea dos veces el mismo día no repite el correo.
 */
@Injectable()
export class CicloSuscripcionService {
  private readonly registro = new Logger(CicloSuscripcionService.name);

  constructor(
    private readonly suscripciones: RepositorioSuscripciones,
    private readonly contenedores: ContenedoresClientePuerto,
    private readonly avisos: AvisosPuerto,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(): Promise<ResultadoCiclo> {
    const ahora = this.reloj.ahora();
    const cambios: CambioCiclo[] = [];
    for (const suscripcion of await this.suscripciones.candidatasCiclo()) {
      const salto = PoliticaCiclo.siguiente(suscripcion, ahora);
      if (!salto) continue;
      const guardada = await this.suscripciones.actualizar(suscripcion.id, PoliticaCiclo.cambioPorSalto(suscripcion, salto, ahora));
      cambios.push({ usuarioId: suscripcion.usuarioId, de: suscripcion.estado, a: salto.estado });
      const detenidos = salto.estado === "suspendida" ? await this.detenerContenedores(suscripcion.usuarioId) : 0;
      await this.avisar(guardada, detenidos);
    }
    return { cambios };
  }

  /** Cuántos contenedores se pidió detener; 0 si M5 falló (se registra y el ciclo sigue). */
  private async detenerContenedores(usuarioId: string): Promise<number> {
    try {
      const { encolados } = await this.contenedores.detenerTodos(usuarioId);
      return encolados;
    } catch (error) {
      this.registro.error(`No se pudieron detener los contenedores de ${usuarioId}: ${mensajeDe(error)}`);
      return 0;
    }
  }

  /** El contrato dice que el puerto no rechaza; igual, un aviso fallido no deshace el salto. */
  private async avisar(suscripcion: Suscripcion, contenedoresDetenidos: number): Promise<void> {
    const aviso = avisoDeTransicion(suscripcion, contenedoresDetenidos);
    if (!aviso) return;
    try {
      await this.avisos.suscripcionCambio(aviso);
    } catch (error) {
      this.registro.warn(`No se pudo avisar a ${suscripcion.usuarioId} del cambio a ${suscripcion.estado}: ${mensajeDe(error)}`);
    }
  }
}

export function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
