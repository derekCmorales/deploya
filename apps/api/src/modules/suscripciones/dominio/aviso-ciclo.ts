import type { AvisoSuscripcion } from "../../notificaciones";
import { precioDe } from "./cambio-plan";
import { MONEDA } from "./pago";
import type { Suscripcion } from "./suscripcion";

const DECIMALES_PRECIO = 2;

/**
 * Aviso de la transición del ciclo §4.4 (SP-04, contrato avisos.md): solo Por vencer y
 * Suspendida avisan; las demás transiciones devuelven `null`. Recibe la suscripción ya guardada,
 * así el aviso dice el plan y la vigencia con los que quedó.
 */
export function avisoDeTransicion(suscripcion: Suscripcion, contenedoresDetenidos: number): AvisoSuscripcion | null {
  const base = { usuarioId: suscripcion.usuarioId, plan: suscripcion.plan.nombre };
  if (suscripcion.estado === "suspendida") return { ...base, estado: "suspendida", contenedoresDetenidos };
  if (suscripcion.estado !== "por-vencer" || !suscripcion.vence || suscripcion.vigenciaDias === null) return null;
  const precio = precioDe(suscripcion.plan, suscripcion.vigenciaDias);
  return {
    ...base,
    estado: "por-vencer",
    venceEl: suscripcion.vence.toISOString(),
    vigenciaDias: suscripcion.vigenciaDias,
    ...(precio === null ? {} : { precio: `${MONEDA} ${precio.toFixed(DECIMALES_PRECIO)}` }),
  };
}
