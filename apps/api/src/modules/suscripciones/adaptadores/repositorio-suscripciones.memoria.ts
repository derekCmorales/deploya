import type { Plan } from "../dominio/plan";
import type { CambioSuscripcion, NuevaSuscripcion, Suscripcion } from "../dominio/suscripcion";
import { RepositorioSuscripciones } from "../puertos/repositorio-suscripciones.puerto";

/** Doble en memoria para pruebas: resuelve el plan con la lista que recibe. */
export class RepositorioSuscripcionesMemoria extends RepositorioSuscripciones {
  private readonly porUsuario = new Map<string, Suscripcion>();
  private siguienteId = 1;

  constructor(private readonly planes: Plan[] = []) {
    super();
  }

  async deUsuario(usuarioId: string): Promise<Suscripcion | null> {
    const suscripcion = this.porUsuario.get(usuarioId);
    return suscripcion ? { ...suscripcion } : null;
  }

  async crearSiNoExiste(nueva: NuevaSuscripcion): Promise<void> {
    if (this.porUsuario.has(nueva.usuarioId)) return;
    const { planId, ...resto } = nueva;
    this.porUsuario.set(nueva.usuarioId, {
      ...resto,
      id: `suscripcion-${this.siguienteId++}`,
      plan: this.plan(planId),
      planSiguiente: null,
    });
  }

  async actualizar(suscripcionId: string, cambio: CambioSuscripcion): Promise<Suscripcion> {
    const actual = this.porId(suscripcionId);
    const { planId, planSiguienteId, estadoDesde: _estadoDesde, ...resto } = cambio;
    return this.guardar({
      ...actual,
      ...resto,
      plan: this.plan(planId),
      planSiguiente: planSiguienteId ? this.plan(planSiguienteId) : null,
    });
  }

  async programarDescenso(suscripcionId: string, planSiguienteId: string): Promise<Suscripcion> {
    return this.guardar({ ...this.porId(suscripcionId), planSiguiente: this.plan(planSiguienteId) });
  }

  guardadas(): Suscripcion[] {
    return [...this.porUsuario.values()];
  }

  private guardar(suscripcion: Suscripcion): Suscripcion {
    this.porUsuario.set(suscripcion.usuarioId, suscripcion);
    return { ...suscripcion };
  }

  private porId(suscripcionId: string): Suscripcion {
    const suscripcion = [...this.porUsuario.values()].find((s) => s.id === suscripcionId);
    if (!suscripcion) throw new Error(`Suscripción ${suscripcionId} fuera del doble`);
    return suscripcion;
  }

  private plan(planId: string): Plan {
    const plan = this.planes.find((p) => p.id === planId);
    if (!plan) throw new Error(`Plan ${planId} fuera del doble`);
    return plan;
  }
}
