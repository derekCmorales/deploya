/**
 * Lógica pura de las pantallas 09 y 09b (M2-06): tipos de `GET /suscripciones/pagos`, formatos
 * y la fila que se abre por defecto. Sin imports de ejecución para probarla con `node --test`.
 */

export type EstadoPago = "aprobado" | "rechazado";

/** Una fila de `GET /suscripciones/pagos`. Fechas en ISO. */
export interface FilaPago {
  id: string;
  fecha: string;
  concepto: string;
  plan: string;
  monto: number;
  moneda: string;
  estado: EstadoPago;
  comprobante: string | null;
  vigencia: { desde: string; hasta: string } | null;
  tarjeta: string;
  titular: string;
}

export const AVISO_SIMULADO = "Todos los cobros son simulados; los comprobantes no tienen valor fiscal.";
export const LEYENDA_COMPROBANTE = "Pago simulado · sin cobro real ni valor fiscal.";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DECIMALES = 2;

function dosDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

/** «03 sep». En UTC, como la API. */
function diaMes(iso: string): string {
  const fecha = new Date(iso);
  return `${dosDigitos(fecha.getUTCDate())} ${MESES[fecha.getUTCMonth()]}`;
}

/** «03 sep 2026». */
export function fechaPago(iso: string): string {
  return `${diaMes(iso)} ${new Date(iso).getUTCFullYear()}`;
}

/** «03 sep 2026, 16:10». */
export function fechaHoraPago(iso: string): string {
  const fecha = new Date(iso);
  return `${fechaPago(iso)}, ${dosDigitos(fecha.getUTCHours())}:${dosDigitos(fecha.getUTCMinutes())}`;
}

/** «03 sep → 03 oct 2026». */
export function textoVigenciaPago(v: NonNullable<FilaPago["vigencia"]>): string {
  return `${diaMes(v.desde)} → ${fechaPago(v.hasta)}`;
}

/** «USD 5.00». */
export function montoPago(monto: number, moneda: string): string {
  return `${moneda} ${monto.toFixed(DECIMALES)}`;
}

/** «Prueba •••• 4242». */
export function metodoPago(tarjeta: string): string {
  return `Prueba ${tarjeta}`;
}

/** La fila que 09 abre al entrar: el pago aprobado más reciente; si no hay, el primero. */
export function filaPorDefecto(filas: FilaPago[]): FilaPago | null {
  return filas.find((f) => f.estado === "aprobado") ?? filas[0] ?? null;
}

/** «Cuenta nueva · plan Sandbox» (subtítulo de 09b). */
export function subtituloSinPagos(plan: string | null): string {
  return plan ? `Cuenta nueva · plan ${plan}` : "Cuenta nueva";
}

/** Ruta de la API del PDF; la web la abre como enlace para que el navegador lo descargue. */
export function rutaComprobantePdf(id: string): string {
  return `/suscripciones/pagos/${encodeURIComponent(id)}/comprobante.pdf`;
}
