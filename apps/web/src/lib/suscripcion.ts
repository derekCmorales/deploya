/**
 * Lógica pura de las pantallas de cobro 07, 07b y 08: tipos del contrato de
 * `/suscripciones/*`, fechas, textos y la tarjeta. Sin imports de ejecución para
 * poder probarla con `node --test`.
 */
import type { PlanCatalogo, Vigencia } from "./planes";

export type EstadoSuscripcion = "activa" | "por-vencer" | "vencida" | "suspendida" | "cancelada";
export type TipoOperacion = "contratacion" | "ascenso" | "renovacion";

export interface PlanBreve {
  codigo: string;
  nombre: string;
}

/** `GET /suscripciones/mia`. Fechas en ISO. */
export interface MiSuscripcion {
  plan: PlanCatalogo;
  estado: EstadoSuscripcion;
  vigenciaDias: number | null;
  inicio: string;
  vence: string | null;
  diasRestantes: number | null;
  precio: number;
  planSiguiente: PlanBreve | null;
}

/** `GET /suscripciones/cotizacion`: resumen de 07 calculado por la API. */
export interface Cotizacion {
  tipo: TipoOperacion;
  desde: PlanBreve;
  plan: PlanBreve;
  vigenciaDias: number;
  monto: number;
  moneda: string;
  inicio: string;
  vence: string;
}

export interface ComprobantePago {
  id: string;
  monto: number;
  moneda: string;
  estado: "aprobado" | "rechazado";
  tarjetaUltimos4: string;
  numeroComprobante: string | null;
  creado: string;
}

/** `POST /suscripciones/contratar` (07b). Un rechazo es un resultado, no un error HTTP. */
export type ResultadoContratacion =
  | { resultado: "aprobado"; pago: ComprobantePago; suscripcion: MiSuscripcion }
  | { resultado: "rechazado"; pago: ComprobantePago; codigo: string; motivo: string };

export const RUTA_SUSCRIPCION = "/suscripcion";
export const RUTA_CONTRATAR = "/planes/contratar";
export const RUTA_PAGOS = "/pagos";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const PORCIENTO = 100;

/** «03 sep». En UTC: la vigencia se guarda en UTC y así no cambia con la zona del navegador. */
export function fechaCorta(iso: string): string {
  const fecha = new Date(iso);
  return `${String(fecha.getUTCDate()).padStart(2, "0")} ${MESES[fecha.getUTCMonth()]}`;
}

/** «03 oct 2026». */
export function fechaLarga(iso: string): string {
  return `${fechaCorta(iso)} ${new Date(iso).getUTCFullYear()}`;
}

/** «24 sep → 24 oct 2026». */
export function rangoVigencia(inicio: string, vence: string): string {
  return `${fechaCorta(inicio)} → ${fechaLarga(vence)}`;
}

export function textoMonto(monto: number, moneda = "USD"): string {
  return `${moneda} ${monto.toFixed(2)}`;
}

/** Posición de «hoy» en la barra de vigencia, de 0 a 100. */
export function progresoVigencia(inicio: string, vence: string, ahora: Date): number {
  const total = new Date(vence).getTime() - new Date(inicio).getTime();
  if (total <= 0) return PORCIENTO;
  const transcurrido = ahora.getTime() - new Date(inicio).getTime();
  return Math.min(PORCIENTO, Math.max(0, Math.round((transcurrido / total) * PORCIENTO)));
}

/** «9 días» · «1 día». */
export function textoDias(dias: number): string {
  return `${dias} ${dias === 1 ? "día" : "días"}`;
}

/** «USD 5.00 / 30 días · sin renovación automática» · «Sin costo · sin vencimiento». */
export function textoCuotaActual(s: Pick<MiSuscripcion, "precio" | "vigenciaDias">): string {
  if (s.vigenciaDias === null || s.precio === 0) return "Sin costo · sin vencimiento";
  return `${textoMonto(s.precio)} / ${s.vigenciaDias} días · sin renovación automática`;
}

/** Chip del plan: «Starter · 9 días» · «Sandbox». */
export function textoChipPlan(s: Pick<MiSuscripcion, "plan" | "diasRestantes">): string {
  return s.diasRestantes === null ? s.plan.nombre : `${s.plan.nombre} · ${textoDias(s.diasRestantes)}`;
}

export function rutaContratar(plan: string, vigencia: Vigencia = "30"): string {
  return `${RUTA_CONTRATAR}?plan=${encodeURIComponent(plan)}&vigencia=${vigencia}`;
}

export function vigenciaDeParametro(valor: string | null): Vigencia {
  return valor === "365" ? "365" : "30";
}

/** «Ascenso desde Sandbox» (subtítulo del resumen de 07). */
export function subtituloOperacion(c: Pick<Cotizacion, "tipo" | "desde" | "plan">): string {
  if (c.tipo === "ascenso") return `Ascenso desde ${c.desde.nombre}`;
  if (c.tipo === "renovacion") return `Renovación de ${c.plan.nombre}`;
  return `Contratación desde ${c.desde.nombre}`;
}

export type TipoCambio = "ascenso" | "descenso";

export interface OpcionCambio {
  plan: PlanCatalogo;
  tipo: TipoCambio;
  /** Ya hay un descenso programado a este plan. */
  programado: boolean;
  precio: string;
  texto: string;
}

/**
 * Filas del panel «Cambiar plan» de 08: cada plan del catálogo menos el actual, en el orden
 * del catálogo. Por encima del actual es ascenso (se paga y arranca hoy); por debajo, descenso
 * (aplica al vencer). Desde Sandbox todo es ascenso.
 */
export function opcionesCambio(catalogo: PlanCatalogo[], actual: Pick<MiSuscripcion, "plan" | "planSiguiente">): OpcionCambio[] {
  const nivelActual = catalogo.findIndex((p) => p.codigo === actual.plan.codigo);
  return catalogo
    .filter((p) => p.codigo !== actual.plan.codigo)
    .map((plan) => {
      const tipo: TipoCambio = catalogo.indexOf(plan) > nivelActual ? "ascenso" : "descenso";
      const precio = plan.precio30 === 0 ? "Sin costo" : textoMonto(plan.precio30);
      return {
        plan,
        tipo,
        programado: actual.planSiguiente?.codigo === plan.codigo,
        precio,
        texto: tipo === "ascenso" ? `Pagas ${precio} y arrancan 30 días nuevos.` : "Aplica cuando termine tu vigencia actual.",
      };
    });
}

// ───────── Tarjeta (07) ─────────

export const DIGITOS_TARJETA = 16;
const TAMANO_GRUPO = 4;
const MES_MAXIMO = 12;
const DIGITOS_FECHA = 2;

export interface TarjetaPrueba {
  numero: string;
  efecto: "aprueba" | "rechaza" | "tarda 5 s";
}

export const TARJETAS_PRUEBA: TarjetaPrueba[] = [
  { numero: "4242 4242 4242 4242", efecto: "aprueba" },
  { numero: "4000 0000 0000 0002", efecto: "rechaza" },
  { numero: "4000 0000 0000 3220", efecto: "tarda 5 s" },
];

export interface FormularioTarjeta {
  titular: string;
  numero: string;
  vencimiento: string;
  cvc: string;
}

export type ErroresTarjeta = Partial<Record<keyof FormularioTarjeta, string>>;

/** «4242424242424242» → «4242 4242 4242 4242» mientras se escribe. */
export function formatearNumeroTarjeta(texto: string): string {
  const digitos = texto.replace(/\D/g, "").slice(0, DIGITOS_TARJETA);
  return digitos.replace(new RegExp(`(\\d{${TAMANO_GRUPO}})(?=\\d)`, "g"), "$1 ");
}

/** «1228» → «12 / 28». */
export function formatearVencimiento(texto: string): string {
  const digitos = texto.replace(/\D/g, "").slice(0, 2 * DIGITOS_FECHA);
  return digitos.length > DIGITOS_FECHA ? `${digitos.slice(0, DIGITOS_FECHA)} / ${digitos.slice(DIGITOS_FECHA)}` : digitos;
}

export function ultimos4(numero: string): string {
  return numero.replace(/\D/g, "").slice(-TAMANO_GRUPO);
}

/** Mismas reglas que la API (`validarSolicitudContratacion`), para marcar el campo antes de enviar. */
export function erroresTarjeta(f: FormularioTarjeta): ErroresTarjeta {
  const errores: ErroresTarjeta = {};
  if (!f.titular.trim()) errores.titular = "Escribe el titular de la tarjeta.";
  if (f.numero.replace(/\D/g, "").length !== DIGITOS_TARJETA) errores.numero = "El número de tarjeta debe tener 16 dígitos.";
  const vencimiento = /^(\d{2})\/(\d{2})$/.exec(f.vencimiento.replace(/\s+/g, ""));
  const mes = vencimiento ? Number(vencimiento[1]) : 0;
  if (mes < 1 || mes > MES_MAXIMO) errores.vencimiento = "El vencimiento debe ser MM / AA.";
  if (!/^\d{3,4}$/.test(f.cvc.trim())) errores.cvc = "El CVC debe tener 3 o 4 dígitos.";
  return errores;
}
