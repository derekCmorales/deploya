import { Injectable } from "@nestjs/common";
import { Reloj } from "../../compartido/reloj";
import { catalogoDe, cuotaDeSuscripcion } from "./dominio/catalogo";
import { PlanNoEncontrado, SuscripcionNoEncontrada } from "./dominio/errores";
import type { PlanCatalogo } from "./dominio/plan";
import type { Cuota } from "./dominio/suscripcion";
import { CODIGO_SANDBOX } from "./dominio/suscripciones.constantes";
import { RepositorioPlanes } from "./puertos/repositorio-planes.puerto";
import { RepositorioSuscripciones } from "./puertos/repositorio-suscripciones.puerto";

/**
 * Facade de M2: lo único que otros módulos usan de suscripciones.
 * M1 llama a `asignarSandbox` al registrar; M3, M4 y M5 leen `cuotaDe`.
 */
@Injectable()
export class SuscripcionesService {
  constructor(
    private readonly planes: RepositorioPlanes,
    private readonly suscripciones: RepositorioSuscripciones,
    private readonly reloj: Reloj,
  ) {}

  async catalogo(): Promise<PlanCatalogo[]> {
    return catalogoDe(await this.planes.todos());
  }

  async asignarSandbox(usuarioId: string): Promise<void> {
    const sandbox = await this.planes.porCodigo(CODIGO_SANDBOX);
    if (!sandbox) throw new PlanNoEncontrado(CODIGO_SANDBOX);
    await this.suscripciones.crearSiNoExiste({
      usuarioId,
      planId: sandbox.id,
      estado: "activa",
      vigenciaDias: null,
      inicio: this.reloj.ahora(),
      vence: null,
    });
  }

  async cuotaDe(usuarioId: string): Promise<Cuota> {
    const suscripcion = await this.suscripciones.deUsuario(usuarioId);
    if (!suscripcion) throw new SuscripcionNoEncontrada(usuarioId);
    return cuotaDeSuscripcion(suscripcion);
  }
}
