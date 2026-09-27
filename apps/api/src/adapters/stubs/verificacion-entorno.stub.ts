import { Injectable } from "@nestjs/common";
import {
  VerificacionEntornoPuerto,
  type ObjetivoSalud,
  type ResultadoSalud,
} from "../../modules/orquestacion/puertos/verificacion-entorno.puerto";

@Injectable()
export class VerificacionEntornoStub extends VerificacionEntornoPuerto {
  resultado: ResultadoSalud = { ok: true, estadoHttp: 200, milisegundos: 38, detalle: "200 OK" };
  readonly objetivos: ObjetivoSalud[] = [];

  async saludable(objetivo: ObjetivoSalud): Promise<ResultadoSalud> {
    this.objetivos.push(objetivo);
    return this.resultado;
  }
}
