import type { Plan, PlanCatalogo } from "../dominio/plan";

/** Strategy (SP-06): qué planes se venden y con cuál arranca una cuenta nueva. */
export abstract class CatalogoPlanes {
  /** Los planes de la pantalla 06; en autoalojado lanza `SinCobroEnAutoalojado`. */
  abstract enVenta(): Promise<PlanCatalogo[]>;
  /** El plan de toda cuenta nueva: Sandbox en la nube, «Autoalojado» en autoalojado. */
  abstract planInicial(): Promise<Plan>;
  /** Contratar, renovar, cotizar e historial de pagos; en autoalojado lanza `SinCobroEnAutoalojado`. */
  abstract exigirCobro(): void;
}
