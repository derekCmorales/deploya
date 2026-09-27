import type { Reloj } from "../../compartido/reloj";
import { INTERVALO_SALUD_MS } from "../../modules/construccion/dominio/motor.constantes";
import {
  VerificacionEntornoPuerto,
  type ObjetivoSalud,
  type ResultadoSalud,
} from "../../modules/orquestacion/puertos/verificacion-entorno.puerto";

const PRIMER_ESTADO_DE_ERROR = 500;
const TIEMPO_POR_INTENTO_MS = 3000;

export type Dormir = (milisegundos: number) => Promise<void>;
export const dormirReal: Dormir = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

/** Salud HTTP: cualquier respuesta < 500 cuenta; reintenta cada segundo hasta el máximo. */
export class VerificacionHttp extends VerificacionEntornoPuerto {
  constructor(
    private readonly reloj: Reloj,
    private readonly dormir: Dormir = dormirReal,
    private readonly pedir: typeof fetch = fetch,
  ) {
    super();
  }

  async saludable(objetivo: ObjetivoSalud): Promise<ResultadoSalud> {
    const inicio = this.reloj.ahora().getTime();
    const url = `http://${objetivo.host}:${objetivo.puerto}${objetivo.ruta}`;
    let detalle = "sin respuesta";
    while (this.reloj.ahora().getTime() - inicio < objetivo.tiempoMaximoMs) {
      const antes = this.reloj.ahora().getTime();
      try {
        const respuesta = await this.pedir(url, { signal: AbortSignal.timeout(TIEMPO_POR_INTENTO_MS) });
        const milisegundos = this.reloj.ahora().getTime() - antes;
        detalle = `GET ${objetivo.ruta} ${respuesta.status}`;
        if (respuesta.status < PRIMER_ESTADO_DE_ERROR) return { ok: true, estadoHttp: respuesta.status, milisegundos, detalle };
      } catch (error) {
        detalle = error instanceof Error ? error.message : String(error);
      }
      await this.dormir(INTERVALO_SALUD_MS);
    }
    return { ok: false, estadoHttp: null, milisegundos: this.reloj.ahora().getTime() - inicio, detalle };
  }
}
