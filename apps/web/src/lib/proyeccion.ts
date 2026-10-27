/**
 * Lógica pura de la tarjeta 08c (Ritmo de construcciones): días del período,
 * proyección al cierre, zona de aviso, textos y puntos de la gráfica.
 * Sin React, DOM, red ni imports de ejecución para poder probarla con `node --test`.
 */

/** Mismo umbral que las gráficas de uso: la zona de aviso empieza al 80 % de la cuota. */
export const UMBRAL_AVISO = 0.8;

const PORCENTAJE = 100;
const MS_POR_DIA = 24 * 60 * 60 * 1000;
const DIAS_ETIQUETA: number[] = [1, 8, 15, 22];
const DECIMALES_PROMEDIO = 1;
const DIVISIONES_EJE = 3;
const PASOS_REDONDOS = [1, 2, 2.5, 5, 10] as const;
const PASO_MINIMO = 1;

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

export interface EjeRitmo {
  tope: number;
  marcas: number[];
}

/**
 * Cómo va el mes: sin proyección (día 1), cuota ya agotada, se acaba antes del cierre,
 * cierra en la zona de aviso o va holgado. Decide la frase y el badge de la tarjeta.
 */
export type EstadoRitmo = "sin-proyeccion" | "agotada" | "se-acaba" | "aviso" | "holgada";

/** Días del mes según el contrato (`desde` y `reinicia` son el mismo día 1), no 31 fijo. */
export function diasDelMes(desde: string, reinicia: string): number {
  const dias = Math.round((Date.parse(reinicia) - Date.parse(desde)) / MS_POR_DIA);
  return Number.isFinite(dias) && dias > 0 ? dias : 0;
}

/** Acumulado al ritmo actual al cierre del período. `null` el día 1: no hay con qué proyectar. */
export function proyectar(diarios: readonly number[], diasDelMes: number): number | null {
  if (diarios.length <= 1 || diasDelMes <= 0) return null;
  return Math.round((total(diarios) / diarios.length) * diasDelMes);
}

export function enZonaAviso(proyeccion: number | null, cuota: number): boolean {
  if (proyeccion === null || cuota <= 0) return false;
  return proyeccion >= cuota * UMBRAL_AVISO;
}

/**
 * Día del período en que se agotan las construcciones, o `null` si alcanzan. Si ya se
 * agotaron es el día en que el acumulado llegó a la cuota; si no, el día al ritmo actual.
 */
export function diaEnQueSeAcaba(diarios: readonly number[], cuota: number, diasDelMes: number): number | null {
  if (diarios.length === 0 || cuota <= 0) return null;
  const agotada = diaEnQueSeAgoto(diarios, cuota);
  if (agotada !== null) return agotada;

  const promedio = total(diarios) / diarios.length;
  if (promedio <= 0) return null;
  const dia = Math.ceil(diarios.length + (cuota - total(diarios)) / promedio);
  return dia <= diasDelMes ? dia : null;
}

export function estadoRitmo(datos: ConsumoDiario): EstadoRitmo {
  if (datos.cuota > 0 && diaEnQueSeAgoto(datos.diarios, datos.cuota) !== null) return "agotada";
  const dias = diasDelMes(datos.desde, datos.reinicia);
  const proyeccion = proyectar(datos.diarios, dias);
  if (proyeccion === null) return "sin-proyeccion";
  if (diaEnQueSeAcaba(datos.diarios, datos.cuota, dias) !== null) return "se-acaba";
  return enZonaAviso(proyeccion, datos.cuota) ? "aviso" : "holgada";
}

/** «4.2»: el promedio diario del período. */
export function promedioPorDia(diarios: readonly number[]): string {
  if (diarios.length === 0) return "0";
  return (total(diarios) / diarios.length).toFixed(DECIMALES_PROMEDIO);
}

/** «56»: el acumulado como % de la cuota, entero. */
export function porcentajeDeCuota(valor: number, cuota: number): number {
  return cuota > 0 ? Math.round((valor / cuota) * PORCENTAJE) : 0;
}

export function puntosRitmo(diarios: readonly number[]): PuntoRitmo[] {
  let acumulado = 0;
  return diarios.map((porDia, indice) => {
    acumulado += porDia;
    return { dia: indice + 1, porDia, acumulado };
  });
}

/**
 * Eje Y con pasos redondos (1, 2, 2.5, 5 × 10ⁿ) en unas tres divisiones: cuota 150 →
 * 0 · 50 · 100 · 150. El tope es la última marca, nunca menos que `maximo`.
 */
export function ejeRitmo(maximo: number): EjeRitmo {
  if (!Number.isFinite(maximo) || maximo <= 0) return { tope: PASO_MINIMO, marcas: [0, PASO_MINIMO] };
  const crudo = maximo / DIVISIONES_EJE;
  const magnitud = 10 ** Math.floor(Math.log10(crudo));
  const paso = Math.max(PASO_MINIMO, (PASOS_REDONDOS.find((base) => base * magnitud >= crudo) ?? 10) * magnitud);
  const divisiones = Math.ceil(maximo / paso - Number.EPSILON);
  const marcas = Array.from({ length: divisiones + 1 }, (_, indice) => Math.round(indice * paso * PORCENTAJE) / PORCENTAJE);
  return { tope: marcas[marcas.length - 1], marcas };
}

/** Las cinco fechas del eje X, con los días reales del período: «01 oct» … «31 oct». */
export function etiquetasDeDia(desde: string, diasDelMes: number): EtiquetaDia[] {
  if (diasDelMes <= 0) return [];
  const dias = DIAS_ETIQUETA.filter((dia) => dia <= diasDelMes);
  const ultimo = dias[dias.length - 1] ?? 0;
  if (ultimo !== diasDelMes) dias.push(diasDelMes);
  return dias.map((dia) => ({ dia, texto: `${String(dia).padStart(2, "0")} ${mesCorto(desde)}` }));
}

/**
 * Índice (0…transcurridos − 1) del día bajo una fracción del ancho. El eje X cubre todo
 * el período y cada día ocupa `1 / diasDelMes` del ancho, así que el índice se acota a
 * los días que ya pasaron; `null` sin días.
 */
export function indiceDeDia(fraccion: number, diasDelMes: number, transcurridos: number): number | null {
  if (diasDelMes <= 0 || transcurridos <= 0) return null;
  const acotada = Number.isFinite(fraccion) ? Math.min(1, Math.max(0, fraccion)) : 0;
  return Math.min(transcurridos - 1, diasDelMes - 1, Math.floor(acotada * diasDelMes));
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
 * La frase de la ficha según el caso: día 1, ya agotada, se acaba antes, zona de aviso u
 * holgada. Las fechas salen del contrato; nunca hay un «20 oct» fijo.
 */
export function fraseRitmo(datos: ConsumoDiario): string {
  const reinicio = diaYMes(datos.reinicia);
  const cierre = "Revertir no gasta construcciones.";

  switch (estadoRitmo(datos)) {
    case "sin-proyeccion":
      return `Aún no hay suficientes días para proyectar el cierre. ${cierre}`;
    case "agotada":
      return `Te quedaste sin construcciones el ${fechaDelDia(datos)}; se reinician el ${reinicio}. ${cierre}`;
    case "se-acaba":
      return `A este ritmo te quedas sin construcciones el ${fechaDelDia(datos)}. ${cierre}`;
    case "aviso":
      return `No te quedas sin construcciones antes del ${reinicio}, pero cierras en la zona de aviso. ${cierre}`;
    case "holgada":
      return `No te quedas sin construcciones antes del ${reinicio}. ${cierre}`;
  }
}

function fechaDelDia(datos: ConsumoDiario): string {
  const dia = diaEnQueSeAcaba(datos.diarios, datos.cuota, diasDelMes(datos.desde, datos.reinicia)) ?? datos.diarios.length;
  const inicio = new Date(datos.desde);
  return diaYMes(new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth(), dia)));
}

function diaEnQueSeAgoto(diarios: readonly number[], cuota: number): number | null {
  const indice = puntosRitmo(diarios).findIndex((punto) => punto.acumulado >= cuota);
  return indice === -1 ? null : indice + 1;
}

function total(diarios: readonly number[]): number {
  return diarios.reduce((suma, valor) => suma + valor, 0);
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
