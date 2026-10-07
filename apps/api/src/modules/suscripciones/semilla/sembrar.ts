import type { Reloj } from "../../../compartido/reloj";
import { PlanNoEncontrado } from "../dominio/errores";
import type { Plan } from "../dominio/plan";
import type { RepositorioPlanes } from "../puertos/repositorio-planes.puerto";
import type { RepositorioSuscripciones } from "../puertos/repositorio-suscripciones.puerto";
import type { SuscripcionesService } from "../suscripciones.service";
import type { DestinoSemilla } from "./destino-semilla.puerto";
import { cambioDemo, CODIGO_PLAN_DEMO, type EstadoDemo, planesSemilla, usuariosSemilla } from "./semilla";

export type Hashear = (clave: string) => Promise<string>;

/** Lo que el seed necesita para dejar las cuentas de demo de bloqueos en su estado. */
export interface PuertosCuentasDemo {
  suscripciones: Pick<RepositorioSuscripciones, "deUsuario" | "actualizar">;
  planes: Pick<RepositorioPlanes, "porCodigo">;
  reloj: Reloj;
}

/** Idempotente: correrlo dos veces deja los mismos registros. */
export async function sembrar(
  destino: DestinoSemilla,
  suscripciones: Pick<SuscripcionesService, "asignarSandbox">,
  hashear: Hashear,
  entorno: NodeJS.ProcessEnv,
  demo: PuertosCuentasDemo,
): Promise<void> {
  const usuarios = usuariosSemilla(entorno);
  for (const plan of planesSemilla()) {
    await destino.guardarPlan(plan);
  }
  const planDemo = await demo.planes.porCodigo(CODIGO_PLAN_DEMO);
  if (!planDemo) throw new PlanNoEncontrado(CODIGO_PLAN_DEMO);
  for (const { clave, estadoDemo, ...usuario } of usuarios) {
    const id = await destino.guardarUsuario({ ...usuario, hashContrasena: await hashear(clave) });
    await suscripciones.asignarSandbox(id);
    if (estadoDemo) await llevarAEstadoDemo(id, estadoDemo, planDemo, demo);
  }
}

/**
 * Solo reescribe la Sandbox recién asignada (`vence === null`): una segunda corrida, o una cuenta
 * que ya movió la tarea diaria de M2-05, no se toca.
 */
async function llevarAEstadoDemo(usuarioId: string, estado: EstadoDemo, plan: Plan, demo: PuertosCuentasDemo): Promise<void> {
  const actual = await demo.suscripciones.deUsuario(usuarioId);
  if (!actual || actual.vence !== null) return;
  await demo.suscripciones.actualizar(actual.id, cambioDemo(estado, plan.id, demo.reloj.ahora()));
}
