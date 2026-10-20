import { esGratuito } from "./cambio-plan";
import type { CambioSuscripcion, EstadoSuscripcionValor, Suscripcion } from "./suscripcion";

/** Días antes de `vence` en que una Activa pasa a Por vencer (§4.4). */
export const DIAS_POR_VENCER = 7;
/** Días en Vencida (entornos en línea, despliegues bloqueados) antes de pasar a Suspendida. */
export const DIAS_GRACIA = 5;
/** Días en Suspendida antes de pasar a Cancelada; los datos se conservan. */
export const DIAS_HASTA_CANCELAR = 30;

const DIA_MS = 24 * 60 * 60 * 1000;

/** Lo que la política lee de una suscripción: no necesita ids ni precios del plan actual. */
export type SuscripcionCiclo = Pick<Suscripcion, "estado" | "estadoDesde" | "vence" | "planSiguiente">;

/** Un salto del ciclo: el estado nuevo y si en este salto se aplica el descenso programado. */
export interface SaltoCiclo {
  estado: EstadoSuscripcionValor;
  aplicarDescenso: boolean;
}

interface Transicion {
  de: readonly EstadoSuscripcionValor[];
  cuando: (suscripcion: SuscripcionCiclo, ahora: Date) => boolean;
  salto: (suscripcion: SuscripcionCiclo) => SaltoCiclo;
}

function vigenciaTerminada({ vence }: SuscripcionCiclo, ahora: Date): boolean {
  return vence !== null && vence.getTime() <= ahora.getTime();
}

function faltanComoMucho(dias: number) {
  return ({ vence }: SuscripcionCiclo, ahora: Date): boolean =>
    vence !== null && vence.getTime() - ahora.getTime() <= dias * DIA_MS;
}

function llevaAlMenos(dias: number) {
  return ({ estadoDesde }: SuscripcionCiclo, ahora: Date): boolean => ahora.getTime() - estadoDesde.getTime() >= dias * DIA_MS;
}

const a = (estado: EstadoSuscripcionValor) => (): SaltoCiclo => ({ estado, aplicarDescenso: false });

/**
 * Al terminar la vigencia: con descenso programado se aplica el plan nuevo sin cobro. Si el plan
 * nuevo es gratuito (Sandbox) queda Activa y deja de vencer; si se paga, sigue el ciclo normal
 * (Vencida) hasta que el cliente lo pague. Sin descenso, Vencida.
 */
function alVencer({ planSiguiente }: SuscripcionCiclo): SaltoCiclo {
  if (!planSiguiente) return { estado: "vencida", aplicarDescenso: false };
  return { estado: esGratuito(planSiguiente) ? "activa" : "vencida", aplicarDescenso: true };
}

/**
 * State en forma de tabla (§4.4): la primera fila que aplica gana; un estado nuevo es una fila.
 * Cancelada no tiene filas: es el final del ciclo.
 */
const TRANSICIONES: readonly Transicion[] = [
  { de: ["activa", "por-vencer"], cuando: vigenciaTerminada, salto: alVencer },
  { de: ["activa"], cuando: faltanComoMucho(DIAS_POR_VENCER), salto: a("por-vencer") },
  { de: ["vencida"], cuando: llevaAlMenos(DIAS_GRACIA), salto: a("suspendida") },
  { de: ["suspendida"], cuando: llevaAlMenos(DIAS_HASTA_CANCELAR), salto: a("cancelada") },
];

/**
 * Política pura del ciclo §4.4 (M2-05): la fecha entra por parámetro. Mueve como mucho un estado
 * por corrida y devuelve `null` si no cambia; como el salto renueva `estadoDesde`, correrla dos
 * veces el mismo día no cambia nada la segunda vez. Sandbox (`vence = null`) no vence.
 */
function siguiente(suscripcion: SuscripcionCiclo, ahora: Date): SaltoCiclo | null {
  if (suscripcion.vence === null) return null;
  const transicion = TRANSICIONES.find((t) => t.de.includes(suscripcion.estado) && t.cuando(suscripcion, ahora));
  return transicion ? transicion.salto(suscripcion) : null;
}

/**
 * Cómo queda la fila tras el salto. El descenso cambia de plan y lo borra; si el plan nuevo es
 * gratuito, deja de tener vigencia. Sin descenso solo cambian `estado` y `estadoDesde`.
 */
function cambioPorSalto(suscripcion: Suscripcion, salto: SaltoCiclo, ahora: Date): CambioSuscripcion {
  const base = {
    planId: suscripcion.plan.id,
    estado: salto.estado,
    estadoDesde: ahora,
    vigenciaDias: suscripcion.vigenciaDias,
    inicio: suscripcion.inicio,
    vence: suscripcion.vence,
    planSiguienteId: suscripcion.planSiguiente?.id ?? null,
  };
  const destino = suscripcion.planSiguiente;
  if (!salto.aplicarDescenso || !destino) return base;
  if (!esGratuito(destino)) return { ...base, planId: destino.id, planSiguienteId: null };
  return { ...base, planId: destino.id, planSiguienteId: null, vigenciaDias: null, inicio: ahora, vence: null };
}

export const PoliticaCiclo = { siguiente, cambioPorSalto } as const;
