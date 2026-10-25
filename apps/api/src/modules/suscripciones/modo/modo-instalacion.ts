import type { Provider, Type } from "@nestjs/common";

/** `MODO_INSTALACION` (contrato instalacion.md, ADR 0008). Sin valor, `nube`. */
export type ModoInstalacion = "nube" | "autoalojado";

export const MODO_INSTALACION = Symbol("MODO_INSTALACION");

const MODOS: readonly ModoInstalacion[] = ["nube", "autoalojado"];

export class ModoInstalacionInvalido extends Error {
  constructor(valor: string) {
    super(`MODO_INSTALACION debe ser nube o autoalojado; llegó «${valor}»`);
    this.name = "ModoInstalacionInvalido";
  }
}

/** Lee el modo del entorno; un valor desconocido no arranca en silencio como nube. */
export function modoInstalacionDesde(entorno: NodeJS.ProcessEnv): ModoInstalacion {
  const valor = (entorno.MODO_INSTALACION ?? "").trim();
  if (!valor) return "nube";
  if (!MODOS.includes(valor as ModoInstalacion)) throw new ModoInstalacionInvalido(valor);
  return valor as ModoInstalacion;
}

export const PROVEEDOR_MODO: Provider = { provide: MODO_INSTALACION, useFactory: () => modoInstalacionDesde(process.env) };

/**
 * Strategy por modo (ADR 0008): registra las dos implementaciones y entrega la del modo bajo el
 * token del puerto. Ningún servicio pregunta por el modo.
 */
export function porModo<T>(token: abstract new (...args: never[]) => T, implementaciones: Record<ModoInstalacion, Type<T>>): Provider[] {
  return [
    implementaciones.nube,
    implementaciones.autoalojado,
    {
      provide: token,
      useFactory: (modo: ModoInstalacion, nube: T, autoalojado: T): T => ({ nube, autoalojado })[modo],
      inject: [MODO_INSTALACION, implementaciones.nube, implementaciones.autoalojado],
    },
  ];
}
