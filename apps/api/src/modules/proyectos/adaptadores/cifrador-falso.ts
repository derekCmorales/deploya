import { CifradorVariables } from '../puertos/cifrador-variables.puerto';
import { VariableIlegible } from '../dominio/errores';

export class CifradorFalso extends CifradorVariables {
  cifrar(valor: string): string {
    const encoded = Buffer.from(valor, 'utf-8').toString('base64');
    return `v1:fake-iv:fake-tag:${encoded}`;
  }

  descifrar(valorCifrado: string): string {
    try {
      const partes = valorCifrado.split(':');
      if (partes.length !== 4 || partes[0] !== 'v1') {
        throw new VariableIlegible();
      }
      return Buffer.from(partes[3], 'base64').toString('utf-8');
    } catch {
      throw new VariableIlegible();
    }
  }
}