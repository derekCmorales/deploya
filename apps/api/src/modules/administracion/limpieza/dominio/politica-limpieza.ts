const DIA_MS = 24 * 60 * 60 * 1000;

/** Un token de cuenta usado o vencido se guarda 7 días más (por si hay que revisar un reclamo). */
export const DIAS_GRACIA_TOKENS = 7;
/** Una sesión revocada se guarda 7 días más. */
export const DIAS_GRACIA_SESIONES_REVOCADAS = 7;
/** Una sesión expira a los 7 días sin actividad; se borra tras 7 de gracia: 14. */
export const DIAS_SESIONES_INACTIVAS = 14;
/** Una invitación usada, revocada o vencida se guarda 30 días más. */
export const DIAS_GRACIA_INVITACIONES = 30;

/** Fechas de corte de la limpieza diaria: se borra lo que quedó antes de cada una. */
export interface CortesLimpieza {
  /** `TokenCuenta` usado o vencido antes de esta fecha. */
  tokens: Date;
  /** `Sesion` revocada antes de esta fecha. */
  sesionesRevocadas: Date;
  /** `Sesion` sin actividad desde antes de esta fecha. */
  sesionesInactivas: Date;
  /** `Invitacion` usada, revocada o vencida antes de esta fecha. */
  invitaciones: Date;
}

function diasAntes(ahora: Date, dias: number): Date {
  return new Date(ahora.getTime() - dias * DIA_MS);
}

/**
 * Policy de la limpieza diaria (EST-01b): los plazos los decide el dominio y el adaptador solo
 * recibe fechas. Regla pura, sin base ni reloj.
 */
export function cortesDeLimpieza(ahora: Date): CortesLimpieza {
  return {
    tokens: diasAntes(ahora, DIAS_GRACIA_TOKENS),
    sesionesRevocadas: diasAntes(ahora, DIAS_GRACIA_SESIONES_REVOCADAS),
    sesionesInactivas: diasAntes(ahora, DIAS_SESIONES_INACTIVAS),
    invitaciones: diasAntes(ahora, DIAS_GRACIA_INVITACIONES),
  };
}

/** Filas borradas por tabla en una corrida. */
export interface FilasPurgadas {
  tokens: number;
  sesiones: number;
  invitaciones: number;
}

export function totalPurgado({ tokens, sesiones, invitaciones }: FilasPurgadas): number {
  return tokens + sesiones + invitaciones;
}

/** Lo que guarda `ConfiguracionInstalacion` y muestra la pantalla 32. */
export interface UltimaLimpieza {
  ultimaLimpieza: Date;
  filasLimpiadas: number;
}
