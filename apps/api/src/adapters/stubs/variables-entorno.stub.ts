import { Injectable } from "@nestjs/common";
import { VariablesEntornoPuerto } from "../../modules/orquestacion/puertos/variables-entorno.puerto";

@Injectable()
export class VariablesEntornoStub extends VariablesEntornoPuerto {
  variables: Record<string, string> = {};
  error: Error | null = null;

  async deProyecto(): Promise<Record<string, string>> {
    if (this.error) throw this.error;
    return { ...this.variables };
  }
}
