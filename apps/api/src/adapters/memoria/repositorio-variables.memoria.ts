import { Injectable } from "@nestjs/common";
import { Reloj } from "../../compartido/reloj";
import {
  RepositorioVariables,
  type VariableGuardada,
  type VariableNueva,
} from "../../modules/proyectos/puertos/repositorio-variables.puerto";

/** Conjunto en memoria para las pruebas. Una fila por clave; reemplazar borra las que faltan. */
@Injectable()
export class RepositorioVariablesMemoria extends RepositorioVariables {
  private readonly porProyecto = new Map<string, VariableGuardada[]>();

  constructor(private readonly reloj: Reloj) {
    super();
  }

  async deProyecto(proyectoId: string): Promise<VariableGuardada[]> {
    return [...(this.porProyecto.get(proyectoId) ?? [])];
  }

  async reemplazar(proyectoId: string, variables: VariableNueva[]): Promise<VariableGuardada[]> {
    const previas = new Map((await this.deProyecto(proyectoId)).map((fila) => [fila.clave, fila]));
    const siguientes = variables.map((variable) => this.fila(variable, previas.get(variable.clave)));
    this.porProyecto.set(proyectoId, siguientes);
    return siguientes;
  }

  private fila(variable: VariableNueva, previa: VariableGuardada | undefined): VariableGuardada {
    const misma = previa?.valorCifrado === variable.valorCifrado;
    return {
      clave: variable.clave,
      valorCifrado: variable.valorCifrado,
      actualizado: misma && previa ? previa.actualizado : this.reloj.ahora(),
    };
  }
}
