import { DatosPagoInvalidos } from "./errores";

/** Datos que la pantalla 07 manda a la pasarela. Nunca se guardan: del pago solo quedan los últimos 4. */
export interface Tarjeta {
  titular: string;
  /** Solo dígitos, sin espacios. */
  numero: string;
  vencimiento: string;
  cvc: string;
}

export const VIGENCIAS_VENDIDAS = [30, 365] as const;
export type VigenciaDias = (typeof VIGENCIAS_VENDIDAS)[number];

export interface SolicitudContratacion {
  plan: string;
  vigenciaDias: VigenciaDias;
  tarjeta: Tarjeta;
}

export interface SolicitudCotizacion {
  plan: string;
  vigenciaDias: VigenciaDias;
}

const DIGITOS_TARJETA = 16;
const DIGITOS_VISIBLES = 4;
const MES_MAXIMO = 12;

export function ultimos4(numero: string): string {
  return numero.slice(-DIGITOS_VISIBLES);
}

export function validarSolicitudContratacion(cuerpo: unknown): SolicitudContratacion {
  const datos = objeto(cuerpo, "Faltan los datos del pago.");
  return { ...validarSolicitudCotizacion(datos), tarjeta: validarTarjeta(datos.tarjeta) };
}

export function validarSolicitudCotizacion(cuerpo: unknown): SolicitudCotizacion {
  const datos = objeto(cuerpo, "Falta el plan.");
  return { plan: codigoPlan(datos.plan), vigenciaDias: vigencia(datos.vigenciaDias) };
}

export function validarSolicitudDescenso(cuerpo: unknown): { plan: string } {
  return { plan: codigoPlan(objeto(cuerpo, "Falta el plan.").plan) };
}

function validarTarjeta(valor: unknown): Tarjeta {
  const tarjeta = objeto(valor, "Faltan los datos de la tarjeta.");
  const titular = texto(tarjeta.titular).trim();
  const numero = texto(tarjeta.numero).replace(/\s+/g, "");
  const vencimiento = texto(tarjeta.vencimiento).replace(/\s+/g, "");
  const cvc = texto(tarjeta.cvc).trim();
  if (!titular) throw new DatosPagoInvalidos("Escribe el titular de la tarjeta.");
  if (!new RegExp(`^\\d{${DIGITOS_TARJETA}}$`).test(numero)) throw new DatosPagoInvalidos("El número de tarjeta debe tener 16 dígitos.");
  if (!vencimientoValido(vencimiento)) throw new DatosPagoInvalidos("El vencimiento debe ser MM / AA.");
  if (!/^\d{3,4}$/.test(cvc)) throw new DatosPagoInvalidos("El CVC debe tener 3 o 4 dígitos.");
  return { titular, numero, vencimiento, cvc };
}

function vencimientoValido(vencimiento: string): boolean {
  const partes = /^(\d{2})\/(\d{2})$/.exec(vencimiento);
  if (!partes) return false;
  const mes = Number(partes[1]);
  return mes >= 1 && mes <= MES_MAXIMO;
}

function codigoPlan(valor: unknown): string {
  const plan = texto(valor).trim().toLowerCase();
  if (!plan) throw new DatosPagoInvalidos("Falta el plan.");
  return plan;
}

function vigencia(valor: unknown): VigenciaDias {
  const dias = Number(valor ?? VIGENCIAS_VENDIDAS[0]);
  const vendida = VIGENCIAS_VENDIDAS.find((v) => v === dias);
  if (!vendida) throw new DatosPagoInvalidos("La vigencia debe ser de 30 o 365 días.");
  return vendida;
}

function objeto(valor: unknown, mensaje: string): Record<string, unknown> {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) throw new DatosPagoInvalidos(mensaje);
  return valor as Record<string, unknown>;
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}
