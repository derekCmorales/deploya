import { GeneradorSecretos } from "../puertos/generador-secretos.puerto";

/** Doble de pruebas: contraseñas predecibles (`aaaa…`, `bbbb…`) del largo pedido. */
export class GeneradorSecretosFijo extends GeneradorSecretos {
  private siguiente = 0;

  contrasena(largo: number): string {
    const letra = String.fromCharCode("a".charCodeAt(0) + (this.siguiente++ % 26));
    return letra.repeat(largo);
  }
}
