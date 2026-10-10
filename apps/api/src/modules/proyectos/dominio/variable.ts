import {
  ClaveInvalida,
  ClaveReservada,
  ValorDemasiadoLargo,
  DemasiadasVariables,
} from './errores';

export const MAXIMO_VARIABLES = 50;
export const MAXIMO_BYTES_VALOR = 4096;
export const MAXIMO_LARGO_CLAVE = 128;

const REGEX_CLAVE = /^[A-Z_][A-Z0-9_]*$/;

export function validarClaveVariable(clave: string): void {
  if (!clave || clave.length > MAXIMO_LARGO_CLAVE) {
    throw new ClaveInvalida(`La clave supera el largo máximo de ${MAXIMO_LARGO_CLAVE}`);
  }
  if (clave === 'PORT') {
    throw new ClaveReservada();
  }
  if (!REGEX_CLAVE.test(clave)) {
    throw new ClaveInvalida('La clave debe contener solo mayúsculas, números y guiones bajos, comenzando con letra o guión bajo');
  }
}

export function validarValorVariable(valor: string): void {
  const bytes = new TextEncoder().encode(valor).length;
  if (bytes > MAXIMO_BYTES_VALOR) {
    throw new ValorDemasiadoLargo(`El valor supera el máximo de ${MAXIMO_BYTES_VALOR} bytes`);
  }
}

export interface VariableInput {
  clave: string;
  valor?: string;
}

export function validarConjuntoVariables(variables: VariableInput[]): void {
  if (variables.length > MAXIMO_VARIABLES) {
    throw new DemasiadasVariables(`No se pueden registrar más de ${MAXIMO_VARIABLES} variables`);
  }

  const clavesVistas = new Set<string>();
  for (const v of variables) {
    validarClaveVariable(v.clave);
    if (clavesVistas.has(v.clave)) {
      throw new ClaveInvalida(`Clave duplicada: ${v.clave}`);
    }
    clavesVistas.add(v.clave);

    if (v.valor !== undefined) {
      validarValorVariable(v.valor);
    }
  }
}