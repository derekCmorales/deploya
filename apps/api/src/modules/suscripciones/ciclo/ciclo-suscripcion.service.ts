import { Injectable, Logger } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import { ContenedoresClientePuerto } from "../../orquestacion/puertos/contenedores-cliente.puerto";
import { PoliticaCiclo } from "../dominio/politica-ciclo";
import type { EstadoSuscripcionValor } from "../dominio/suscripcion";
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
 * (Observer): si M5 falla, la suscripción queda Suspendida igual y las demás siguen.
 */
@Injectable()
export class CicloSuscripcionService {
  private readonly registro = new Logger(CicloSuscripcionService.name);

  constructor(
    private readonly suscripciones: RepositorioSuscripciones,
    private readonly contenedores: ContenedoresClientePuerto,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(): Promise<ResultadoCiclo> {
    const ahora = this.reloj.ahora();
    const cambios: CambioCiclo[] = [];
    for (const suscripcion of await this.suscripciones.candidatasCiclo()) {
      const salto = PoliticaCiclo.siguiente(suscripcion, ahora);
      if (!salto) continue;
      await this.suscripciones.actualizar(suscripcion.id, PoliticaCiclo.cambioPorSalto(suscripcion, salto, ahora));
      cambios.push({ usuarioId: suscripcion.usuarioId, de: suscripcion.estado, a: salto.estado });
      if (salto.estado === "suspendida") await this.detenerContenedores(suscripcion.usuarioId);
    }
    return { cambios };
  }

  private async detenerContenedores(usuarioId: string): Promise<void> {
    try {
      await this.contenedores.detenerTodos(usuarioId);
    } catch (error) {
      this.registro.error(`No se pudieron detener los contenedores de ${usuarioId}: ${mensajeDe(error)}`);
    }
  }
}

export function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
