import type { Plan } from "../dominio/plan";
import { RepositorioPlanes } from "../puertos/repositorio-planes.puerto";

/** Doble en memoria para pruebas: mismo contrato que el adaptador Prisma. */
export class RepositorioPlanesMemoria extends RepositorioPlanes {
  constructor(private readonly planes: Plan[] = []) {
    super();
  }

  async todos(): Promise<Plan[]> {
    return this.planes.map((plan) => ({ ...plan }));
  }

  async porCodigo(codigo: string): Promise<Plan | null> {
    const plan = this.planes.find((p) => p.codigo === codigo);
    return plan ? { ...plan } : null;
  }
}
