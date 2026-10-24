import { Injectable } from "@nestjs/common";
import { Reloj } from "../../compartido/reloj";
import { SuscripcionNoEncontrada } from "./dominio/errores";
import type { PlanCatalogo } from "./dominio/plan";
import type { Cuota } from "./dominio/suscripcion";
import { CatalogoPlanes } from "./modo/catalogo-planes.puerto";
import { PoliticaCuotas } from "./modo/politica-cuotas.puerto";
import { RepositorioSuscripciones } from "./puertos/repositorio-suscripciones.puerto";

/**
 * Facade de M2: lo único que otros módulos usan de suscripciones.
 * M1 llama a `asignarSandbox` al registrar; M3, M4 y M5 leen `cuotaDe`. El catálogo y la cuota
 * salen de las estrategias del modo de instalación (SP-06): el servicio no pregunta por el modo.
 */
@Injectable()
export class SuscripcionesService {
  constructor(
    private readonly catalogoPlanes: CatalogoPlanes,
    private readonly suscripciones: RepositorioSuscripciones,
    private readonly cuotas: PoliticaCuotas,
    private readonly reloj: Reloj,
  ) {}

  catalogo(): Promise<PlanCatalogo[]> {
    return this.catalogoPlanes.enVenta();
  }

  /** El plan inicial de la cuenta nueva: Sandbox en la nube, «Autoalojado» en autoalojado. */
  async asignarSandbox(usuarioId: string): Promise<void> {
    const plan = await this.catalogoPlanes.planInicial();
    await this.suscripciones.crearSiNoExiste({
      usuarioId,
      planId: plan.id,
      estado: "activa",
      vigenciaDias: null,
      inicio: this.reloj.ahora(),
      vence: null,
    });
  }

  async cuotaDe(usuarioId: string): Promise<Cuota> {
    const suscripcion = await this.suscripciones.deUsuario(usuarioId);
    if (!suscripcion) throw new SuscripcionNoEncontrada(usuarioId);
    return this.cuotas.cuotaDe(suscripcion);
  }
}
