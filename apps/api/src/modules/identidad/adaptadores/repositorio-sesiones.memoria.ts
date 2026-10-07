import { randomUUID } from "node:crypto";
import type { NuevaSesion, Sesion } from "../dominio/sesion";
import { RepositorioSesiones } from "../puertos/repositorio-sesiones.puerto";

/** Doble de pruebas con la misma semántica que el adaptador Prisma. */
export class RepositorioSesionesMemoria extends RepositorioSesiones {
  readonly sesiones = new Map<string, Sesion>();

  async crear({ agenteUsuario: _agente, ...sesion }: NuevaSesion): Promise<Sesion> {
    const creada = { ...sesion, id: randomUUID(), revocadaEn: null };
    this.sesiones.set(creada.id, creada);
    return { ...creada };
  }

  async porHuella(hashToken: string): Promise<Sesion | null> {
    const sesion = [...this.sesiones.values()].find((s) => s.hashToken === hashToken);
    return sesion ? { ...sesion } : null;
  }

  async registrarActividad(id: string, marca: Date): Promise<void> {
    const sesion = this.sesiones.get(id);
    if (sesion) this.sesiones.set(id, { ...sesion, ultimaActividad: marca });
  }

  async revocar(id: string, marca: Date): Promise<void> {
    const sesion = this.sesiones.get(id);
    if (sesion) this.sesiones.set(id, { ...sesion, revocadaEn: marca });
  }

  async revocarTodasDe(usuarioId: string, marca: Date): Promise<void> {
    for (const sesion of this.sesiones.values()) {
      if (sesion.usuarioId === usuarioId && !sesion.revocadaEn) this.sesiones.set(sesion.id, { ...sesion, revocadaEn: marca });
    }
  }
}
