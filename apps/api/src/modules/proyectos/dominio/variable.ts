import { ClaveInvalida, ClaveReservada, DemasiadasVariables, ValorDemasiadoLargo } from "./errores";

export const MAXIMO_VARIABLES = 50;
export const MAXIMO_BYTES_VALOR = 4096;
export const MAXIMO_LARGO_CLAVE = 128;
export const CLAVE_RESERVADA = "PORT";
export const PREFIJO_CIFRADO = "v1";

const CLAVE_VALIDA = /^[A-Z_][A-Z0-9_]*$/;

export interface EntradaVariable {
  clave: string;
  valor?: string;
}

/** Value object: la regla vive en el dominio, no en el controlador. */
export class ClaveVariable {
  readonly valor: string;

  constructor(clave: string) {
    this.valor = claveNormal(clave);
  }
}

export function validarConjuntoVariables(entradas: readonly EntradaVariable[]): void {
  if (entradas.length > MAXIMO_VARIABLES) throw new DemasiadasVariables(MAXIMO_VARIABLES);
  const vistas = new Set<string>();
  for (const entrada of entradas) validarEntrada(entrada, vistas);
}

function claveNormal(clave: string): string {
  if (clave === CLAVE_RESERVADA) throw new ClaveReservada();
  if (!clave || clave.length > MAXIMO_LARGO_CLAVE || !CLAVE_VALIDA.test(clave)) throw new ClaveInvalida();
  return clave;
}

function validarEntrada(entrada: EntradaVariable, vistas: Set<string>): void {
  const clave = new ClaveVariable(entrada.clave).valor;
  if (vistas.has(clave)) throw new ClaveInvalida(`La clave ${clave} está repetida.`);
  vistas.add(clave);
  if (entrada.valor !== undefined) validarValor(entrada.valor);
}

function validarValor(valor: string): void {
  if (Buffer.byteLength(valor) > MAXIMO_BYTES_VALOR) throw new ValorDemasiadoLargo();
}
