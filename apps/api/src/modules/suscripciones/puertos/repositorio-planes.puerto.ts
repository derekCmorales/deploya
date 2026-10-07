import type { Plan } from "../dominio/plan";

export abstract class RepositorioPlanes {
  abstract todos(): Promise<Plan[]>;
  abstract porCodigo(codigo: string): Promise<Plan | null>;
}
