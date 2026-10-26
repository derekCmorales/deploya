/**
 * Lógica pura de la tarjeta 08c (Ritmo de construcciones): días del período,
 * proyección al cierre, zona de aviso, textos y puntos de la gráfica.
 * Sin React, DOM, red ni imports de ejecución para poder probarla con `node --test`.
 */

/** Mismo umbral que las gráficas de uso: la zona de aviso empieza al 80 % de la cuota. */
export const UMBRAL_AVISO = 0.8;

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const DIAS_ETIQUETA: number[] = [1, 8, 15, 22];
const DECIMALES_PROMEDIO = 1;

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;
const MESES_LARGOS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

/** `GET /observabilidad/consumo/diario`: el contrato de metricas.md § Ritmo de construcciones. */
export interface ConsumoDiario {
  desde: string;
  reinicia: string;
  cuota: number;
  diarios: number[];
}

export interface PuntoRitmo {
  dia: number;
  porDia: number;
  acumulado: number;
}

export interface EtiquetaDia {
  dia: number;
  texto: string;
}

/** Días del mes según el contrato (`desde` y `reinicia` son el mismo día 1), no 31 fijo. */
export function diasDelMes(desde: string, reinicia: string): number {
  const dias = Math.round((Date.parse(reinicia) - Date.parse(desde)) / MS_POR_DIA);
  return Number.isFinite(dias) && dias > 0 ? dias : 0;
}

/** Acumulado al ritmo actual al cierre del período. `null` el día 1: no hay con qué proyectar. */
export function proyectar(diarios: readonly number[], diasDelMes: number): number | null {
  if (diarios.length <= 1 || diasDelMes <= 0) return null;
  const total = diarios.reduce((suma, valor) => suma + valor, 0);
  return Math.round((total / diarios.length) * diasDelMes);
}

export function enZonaAviso(proyeccion: number | null, cuota: number): boolean {
  if (proyeccion === null || cuota <= 0) return false;
  return proyeccion >= cuota * UMBRAL_AVISO;
}

/** Día del período en que se agotan las construcciones al ritmo actual, o `null` si alcanza. */
export function diaEnQueSeAcaba(diarios: readonly number[], cuota: number, diasDelMes: number): number | null {
  if (diarios.length === 0 || cuota <= 0) return null;
  const total = diarios.reduce((suma, valor) => suma + valor, 0);
  const promedio = total / diarios.length;
  if (promedio <= 0) return null;

  const restantes = cuota - total;
  if (restantes <= 0) return diarios.length;

  const dia = Math.ceil(diarios.length + restantes / promedio);
  return dia <= diasDelMes ? dia : null;
}

/** «4.2»: el promedio diario del período. */
export function promedioPorDia(diarios: readonly number[]): string {
  if (diarios.length === 0) return "0";
  const total = diarios.reduce((suma, valor) => suma + valor, 0);
  return (total / diarios.length).toFixed(DECIMALES_PROMEDIO);
}

export function puntosRitmo(diarios: readonly number[]): PuntoRitmo[] {
  let acumulado = 0;
  return diarios.map((porDia, indice) => {
    acumulado += porDia;
    return { dia: indice + 1, porDia, acumulado };
  });
}

/** Las cinco fechas del eje X, con los días reales del período: «01 oct» … «31 oct». */
export function etiquetasDeDia(desde: string, diasDelMes: number): EtiquetaDia[] {
  if (diasDelMes <= 0) return [];
  const dias = DIAS_ETIQUETA.filter((dia) => dia <= diasDelMes);
  const ultimo = dias[dias.length - 1] ?? 0;
  if (ultimo !== diasDelMes) dias.push(diasDelMes);
  return dias.map((dia) => ({ dia, texto: `${String(dia).padStart(2, "0")} ${mesCorto(desde)}` }));
}

/** Día (1…n) que cae bajo una fracción del ancho de la gráfica; `null` sin días. */
export function indiceDeDia(fraccion: number, total: number): number | null {
  if (total <= 0) return null;
  const acotada = Number.isFinite(fraccion) ? Math.min(1, Math.max(0, fraccion)) : 0;
  return Math.round(acotada * (total - 1));
}

/** «20 oct»: el día y el mes del período, para ejes y tooltips. */
export function etiquetaDia(desde: string, dia: number): string {
  return `${dia} ${mesCorto(desde)}`;
}

/** «Octubre · Starter, 150 por mes · se reinicia el 1 nov» con los datos del contrato. */
export function cabeceraRitmo(datos: ConsumoDiario, plan: string): string {
  return `${mesLargo(datos.desde)} · ${plan}, ${datos.cuota} por mes · se reinicia el ${diaYMes(datos.reinicia)}`;
}

/**
 * La frase de la ficha según el caso: día 1, se acaba antes, zona de aviso u holgada.
 * Las fechas salen del contrato; nunca hay un «20 oct» fijo.
 */
export function fraseRitmo(datos: ConsumoDiario): string {
  const dias = diasDelMes(datos.desde, datos.reinicia);
  const proyeccion = proyectar(datos.diarios, dias);
  const reinicio = diaYMes(datos.reinicia);

  if (proyeccion === null) {
    return "Aún no hay suficientes días para proyectar el cierre. Revertir no gasta construcciones.";
  }

  const fin = diaEnQueSeAcaba(datos.diarios, datos.cuota, dias);
  if (fin !== null) {
    return `A este ritmo te quedas sin construcciones el ${diaYMes(diaDelPeriodo(datos.desde, fin))}. Revertir no gasta construcciones.`;
  }

  if (enZonaAviso(proyeccion, datos.cuota)) {
    return `No te quedas sin construcciones antes del ${reinicio}, pero cierras en la zona de aviso. Revertir no gasta construcciones.`;
  }

  return `No te quedas sin construcciones antes del ${reinicio}. Revertir no gasta construcciones.`;
}

function diaDelPeriodo(desde: string, dia: number): Date {
  const inicio = new Date(desde);
  return new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth(), dia));
}

function diaYMes(iso: string | Date): string {
  const fecha = typeof iso === "string" ? new Date(iso) : iso;
  return `${fecha.getUTCDate()} ${MESES_CORTOS[fecha.getUTCMonth()]}`;
}

function mesCorto(iso: string): string {
  return MESES_CORTOS[new Date(iso).getUTCMonth()];
}

function mesLargo(iso: string): string {
  const mes = MESES_LARGOS[new Date(iso).getUTCMonth()];
  return mes.charAt(0).toUpperCase() + mes.slice(1);
}
