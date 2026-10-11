import { Injectable } from "@nestjs/common";
import { VariablesIlegibles } from "../../construccion/dominio/errores";
import { VariableIlegible } from "../../proyectos/dominio/errores";
import { VariablesProyectoService } from "../../proyectos/servicios/variables-proyecto.service";
import { VariablesEntornoPuerto } from "../puertos/variables-entorno.puerto";

/** Adaptador de M5 sobre `descifradasDe`. Traduce el error de M3 al fallo de Ejecución. */
@Injectable()
export class VariablesEntornoProyecto extends VariablesEntornoPuerto {
  constructor(private readonly variables: VariablesProyectoService) {
    super();
  }

  async deProyecto(proyectoId: string): Promise<Record<string, string>> {
    try {
      return await this.variables.descifradasDe(proyectoId);
    } catch (error) {
      if (error instanceof VariableIlegible) throw new VariablesIlegibles();
      throw error;
    }
  }
}
