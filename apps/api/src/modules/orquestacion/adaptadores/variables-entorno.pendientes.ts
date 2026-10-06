import { Injectable } from "@nestjs/common";
import { VariablesEntornoPuerto } from "../puertos/variables-entorno.puerto";

/**
 * Binding provisional mientras `VariablesProyectoService` (M3-03, Eduardo) no esté en `main`:
 * ningún proyecto tiene variables. Se reemplaza por el adaptador sobre `descifradasDe` en
 * `orquestacion-trabajador.module.ts`, sin tocar `PasoEjecucion`.
 */
@Injectable()
export class VariablesEntornoPendientes extends VariablesEntornoPuerto {
  async deProyecto(): Promise<Record<string, string>> {
    return {};
  }
}
