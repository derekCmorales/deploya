import type { Artefacto } from "../dominio/despliegue";

export type NuevoArtefacto = Omit<Artefacto, "id" | "disponible">;

export abstract class RepositorioArtefactos {
  abstract registrar(nuevo: NuevoArtefacto): Promise<Artefacto>;
  abstract porId(id: string): Promise<Artefacto | null>;
  /** Todos los del proyecto, del #n más reciente al más antiguo; incluye los retirados (pantalla 14). */
  abstract deProyecto(proyectoId: string): Promise<Artefacto[]>;
  /** Solo los que aún tienen su imagen en el nodo (candidatos a la retención). */
  abstract disponiblesDe(proyectoId: string): Promise<Artefacto[]>;
  abstract marcarNoDisponible(id: string): Promise<void>;
}
