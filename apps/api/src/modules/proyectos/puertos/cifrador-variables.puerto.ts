/** Cifrado en reposo de los valores (AES-256-GCM en producción, doble en pruebas). */
export abstract class CifradorVariables {
  abstract cifrar(valor: string): string;
  abstract descifrar(valorCifrado: string): string;
}
