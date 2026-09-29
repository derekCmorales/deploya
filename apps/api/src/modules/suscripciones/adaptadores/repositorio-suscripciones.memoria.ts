import type { Plan } from "../dominio/plan";
import type { NuevaSuscripcion, Suscripcion } from "../dominio/suscripcion";
import { RepositorioSuscripciones } from "../puertos/repositorio-suscripciones.puerto";

/** Doble en memoria para pruebas: resuelve el plan con la lista que recibe. */
export class RepositorioSuscripcionesMemoria extends RepositorioSuscripciones {
  private readonly porUsuario = new Map<string, Suscripcion>();
  private siguienteId = 1;

  constructor(private readonly planes: Plan[] = []) {
    super();
  }

  async deUsuario(usuarioId: string): Promise<Suscripcion | null> {
    return this.porUsuario.get(usuarioId) ?? null;
  }

  async crearSiNoExiste(nueva: NuevaSuscripcion): Promise<void> {
    if (this.porUsuario.has(nueva.usuarioId)) return;
    const plan = this.planes.find((p) => p.id === nueva.planId);
    if (!plan) throw new Error(`Plan ${nueva.planId} fuera del doble`);
    const { planId: _planId, ...resto } = nueva;
    this.porUsuario.set(nueva.usuarioId, { ...resto, id: `suscripcion-${this.siguienteId++}`, plan });
  }

  guardadas(): Suscripcion[] {
    return [...this.porUsuario.values()];
  }
}
