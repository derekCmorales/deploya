import type { SuscripcionesService } from "../suscripciones.service";
import type { DestinoSemilla } from "./destino-semilla.puerto";
import { planesSemilla, usuariosSemilla } from "./semilla";

export type Hashear = (clave: string) => Promise<string>;

/** Idempotente: correrlo dos veces deja los mismos registros. */
export async function sembrar(
  destino: DestinoSemilla,
  suscripciones: Pick<SuscripcionesService, "asignarSandbox">,
  hashear: Hashear,
  entorno: NodeJS.ProcessEnv,
): Promise<void> {
  const usuarios = usuariosSemilla(entorno);
  for (const plan of planesSemilla()) {
    await destino.guardarPlan(plan);
  }
  for (const { clave, ...usuario } of usuarios) {
    const id = await destino.guardarUsuario({ ...usuario, hashContrasena: await hashear(clave) });
    await suscripciones.asignarSandbox(id);
  }
}
