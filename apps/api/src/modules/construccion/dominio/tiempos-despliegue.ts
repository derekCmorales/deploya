import type { Despliegue, EtapaRegistrada } from "./despliegue";
import { ETAPAS, type EstadoDespliegue, type Etapa } from "./estados";

/** Etapa sin marcas, omitida o posterior al fallo. */
export const DURACION_OMITIDA_MS = 0;

/** Cuerpo de cada elemento de `RepositorioDespliegues.tiemposDe` (contrato métricas). */
export interface TiemposDespliegue {
  numero: number;
  creado: Date;
  estado: EstadoDespliegue;
  reversion: boolean;
  etapas: Record<Etapa, number>;
  falloEn: Etapa | null;
}

/**
 * Duración en ms de cada etapa. `falloEn` es la etapa donde terminó un Fallido;
 * las siguientes quedan en 0 aunque tengan marcas.
 */
export function tiemposDeDespliegue(despliegue: Despliegue): TiemposDespliegue {
  const falloEn = etapaFallida(despliegue);
  return {
    numero: despliegue.numero,
    creado: despliegue.creado,
    estado: despliegue.estado,
    reversion: despliegue.disparador === "reversion",
    etapas: duraciones(despliegue.etapas, falloEn),
    falloEn,
  };
}

/** Etapa donde terminó un Fallido; `null` si no falló o no quedó marcada. */
export function etapaFallida(despliegue: Despliegue): Etapa | null {
  if (despliegue.estado !== "fallido") return null;
  return despliegue.etapas.find((etapa) => etapa.estado === "fallida")?.etapa ?? null;
}

function duraciones(etapas: readonly EtapaRegistrada[], falloEn: Etapa | null): Record<Etapa, number> {
  const corte = falloEn === null ? ETAPAS.length : ETAPAS.indexOf(falloEn);
  const tiempos = {} as Record<Etapa, number>;
  for (const etapa of ETAPAS) {
    tiempos[etapa] = ETAPAS.indexOf(etapa) > corte ? DURACION_OMITIDA_MS : milisegundosDe(etapas, etapa);
  }
  return tiempos;
}

function milisegundosDe(etapas: readonly EtapaRegistrada[], etapa: Etapa): number {
  const registro = etapas.find((item) => item.etapa === etapa);
  if (!registro || registro.estado === "omitida" || !registro.iniciada || !registro.terminada) return DURACION_OMITIDA_MS;
  return Math.max(DURACION_OMITIDA_MS, registro.terminada.getTime() - registro.iniciada.getTime());
}
