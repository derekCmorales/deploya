import type { Invitacion, InvitacionActiva, NuevaInvitacion } from "../dominio/invitacion";
import { RepositorioInvitaciones } from "../puertos/repositorio-invitaciones.puerto";

/** Doble en memoria para las pruebas, con las mismas reglas que la consulta de Prisma. */
export class RepositorioInvitacionesMemoria extends RepositorioInvitaciones {
  readonly guardadas: Invitacion[] = [];

  async crear(nueva: NuevaInvitacion): Promise<Invitacion> {
    const invitacion: Invitacion = { ...nueva, id: `inv-${this.guardadas.length + 1}`, usada: null, revocada: null };
    this.guardadas.push(invitacion);
    return { ...invitacion };
  }

  async activas(ahora: Date): Promise<InvitacionActiva[]> {
    return this.guardadas
      .filter((i) => !i.usada && !i.revocada && i.vence.getTime() > ahora.getTime())
      .sort((a, b) => a.vence.getTime() - b.vence.getTime())
      .map(({ id, correo, vence }) => ({ id, correo, vence }));
  }

  async porId(id: string): Promise<Invitacion | null> {
    return this.guardadas.find((i) => i.id === id) ?? null;
  }

  async porHash(hashToken: string): Promise<Invitacion | null> {
    return this.guardadas.find((i) => i.hashToken === hashToken) ?? null;
  }

  async revocar(id: string, marca: Date): Promise<void> {
    const invitacion = this.guardadas.find((i) => i.id === id);
    if (invitacion) invitacion.revocada = marca;
  }

  async marcarUsada(id: string, marca: Date): Promise<boolean> {
    const invitacion = this.guardadas.find((i) => i.id === id && !i.usada);
    if (!invitacion) return false;
    invitacion.usada = marca;
    return true;
  }
}
