export const DIAS_ACTIVIDAD = 84;
const LARGO_FECHA_ISO = 10;

export interface MuestraDespliegueActividad {
  creado: Date;
  estado: string;
}

export interface ActividadDia {
  fecha: string;
  total: number;
  fallidos: number;
}

/** Primer instante (00:00 UTC) de la ventana de `dias` que termina hoy. */
export function inicioVentanaActividad(hoy: Date, dias = DIAS_ACTIVIDAD): Date {
  return new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() - (dias - 1)));
}

/**
 * Devuelve siempre `dias` días (84 por defecto) que terminan en `hoy` (UTC),
 * en orden cronológico, con los días sin despliegues en 0 y `fallidos` cuando `estado === "fallido"`.
 */
export function agruparPorDia(
  despliegues: readonly MuestraDespliegueActividad[],
  hoy: Date,
  dias = DIAS_ACTIVIDAD,
): ActividadDia[] {
  const porFecha = new Map<string, ActividadDia>();
  for (let desplazamiento = dias - 1; desplazamiento >= 0; desplazamiento--) {
    const fecha = fechaUtc(hoy, -desplazamiento);
    porFecha.set(fecha, { fecha, total: 0, fallidos: 0 });
  }

  for (const despliegue of despliegues) {
    const dia = porFecha.get(fechaIsoDe(despliegue.creado));
    if (!dia) continue;
    dia.total += 1;
    if (despliegue.estado === "fallido") dia.fallidos += 1;
  }

  return [...porFecha.values()];
}

function fechaUtc(base: Date, desplazamientoDias: number): string {
  return fechaIsoDe(
    new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + desplazamientoDias)),
  );
}

function fechaIsoDe(fecha: Date): string {
  return fecha.toISOString().slice(0, LARGO_FECHA_ISO);
}