import type { Artefacto } from "../dominio/despliegue";

export type NuevoArtefacto = Omit<Artefacto, "id" | "disponible">;

export abstract class RepositorioArtefactos {
  abstract registrar(nuevo: NuevoArtefacto): Promise<Artefacto>;
  abstract porId(id: string): Promise<Artefacto | null>;
}
