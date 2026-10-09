export abstract class CifradorVariables {
  abstract cifrar(valor: string): string;
  abstract descifrar(valorCifrado: string): string;
}