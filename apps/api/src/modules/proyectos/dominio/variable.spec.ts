/// <reference types="jest" />

import {
  validarClaveVariable,
  validarValorVariable,
  validarConjuntoVariables,
  MAXIMO_VARIABLES,
  MAXIMO_BYTES_VALOR,
} from './variable';
import {
  ClaveInvalida,
  ClaveReservada,
  ValorDemasiadoLargo,
  DemasiadasVariables,
} from './errores';

describe('Dominio de Variables', () => {
  it('Clave válida pasa la validación', () => {
    expect(() => validarClaveVariable('MI_VARIABLE_1')).not.toThrow();
    expect(() => validarClaveVariable('_VAR')).not.toThrow();
  });

  it('Clave inválida por minúsculas, espacios o caracteres especiales lanza ClaveInvalida', () => {
    expect(() => validarClaveVariable('mi_variable')).toThrow(ClaveInvalida);
    expect(() => validarClaveVariable('MI VARIABLE')).toThrow(ClaveInvalida);
    expect(() => validarClaveVariable('MI-VARIABLE')).toThrow(ClaveInvalida);
    expect(() => validarClaveVariable('123_VAR')).toThrow(ClaveInvalida);
  });

  it('La clave PORT está reservada y lanza ClaveReservada', () => {
    expect(() => validarClaveVariable('PORT')).toThrow(ClaveReservada);
  });

  it('Valor que excede los bytes permitidos lanza ValorDemasiadoLargo', () => {
    const valorLargo = 'a'.repeat(MAXIMO_BYTES_VALOR + 1);
    expect(() => validarValorVariable(valorLargo)).toThrow(ValorDemasiadoLargo);
  });

  it('Conjunto que excede el número máximo de variables lanza DemasiadasVariables', () => {
    const variables = Array.from({ length: MAXIMO_VARIABLES + 1 }, (_, i) => ({
      clave: `VAR_${i}`,
      valor: 'valor',
    }));
    expect(() => validarConjuntoVariables(variables)).toThrow(DemasiadasVariables);
  });

  it('Claves duplicadas en el conjunto lanzan ClaveInvalida', () => {
    const variables = [
      { clave: 'MI_VAR', valor: '1' },
      { clave: 'MI_VAR', valor: '2' },
    ];
    expect(() => validarConjuntoVariables(variables)).toThrow(ClaveInvalida);
  });
});