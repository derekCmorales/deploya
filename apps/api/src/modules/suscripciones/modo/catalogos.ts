import { Injectable } from "@nestjs/common";
import { catalogoDe } from "../dominio/catalogo";
import { PlanNoEncontrado, SinCobroEnAutoalojado } from "../dominio/errores";
import type { Plan, PlanCatalogo } from "../dominio/plan";
import { CODIGO_AUTOALOJADO } from "../dominio/plan-autoalojado";
import { CODIGO_SANDBOX } from "../dominio/suscripciones.constantes";
import { RepositorioPlanes } from "../puertos/repositorio-planes.puerto";
import { CatalogoPlanes } from "./catalogo-planes.puerto";

async function planPorCodigo(planes: RepositorioPlanes, codigo: string): Promise<Plan> {
  const plan = await planes.porCodigo(codigo);
  if (!plan) throw new PlanNoEncontrado(codigo);
  return plan;
}

/** Nube: los cuatro planes v4.1 en venta y toda cuenta nueva en Sandbox (DB-01). */
@Injectable()
export class CatalogoNube extends CatalogoPlanes {
  constructor(private readonly planes: RepositorioPlanes) {
    super();
  }

  async enVenta(): Promise<PlanCatalogo[]> {
    return catalogoDe(await this.planes.todos());
  }

  planInicial(): Promise<Plan> {
    return planPorCodigo(this.planes, CODIGO_SANDBOX);
  }

  exigirCobro(): void {}
}

/** Autoalojado: un solo plan sin cobro ni vencimiento; nada se vende. */
@Injectable()
export class CatalogoAutoalojado extends CatalogoPlanes {
  constructor(private readonly planes: RepositorioPlanes) {
    super();
  }

  async enVenta(): Promise<PlanCatalogo[]> {
    throw new SinCobroEnAutoalojado();
  }

  planInicial(): Promise<Plan> {
    return planPorCodigo(this.planes, CODIGO_AUTOALOJADO);
  }

  exigirCobro(): void {
    throw new SinCobroEnAutoalojado();
  }
}
