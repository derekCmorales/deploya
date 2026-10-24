import { ColaCicloPuerto } from "./cola-ciclo.puerto";

/** Autoalojado (SP-06): no hay vencimientos, así que la tarea diaria del ciclo no se programa. */
export class ColaCicloApagada extends ColaCicloPuerto {
  async iniciar(): Promise<void> {}

  async cerrar(): Promise<void> {}
}
