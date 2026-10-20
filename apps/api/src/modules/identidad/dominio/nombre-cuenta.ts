import { LARGO_MAXIMO_NOMBRE } from "./cuenta";
import { NombreInvalido } from "./errores";

/**
 * Value Object del nombre de la cuenta (M1-06): recorta los espacios y exige de 1 a 64
 * caracteres. Es la misma regla para el registro y para «Mi cuenta · Perfil».
 */
export class NombreCuenta {
  private constructor(readonly valor: string) {}

  static de(texto: string): NombreCuenta {
    const recortado = texto.trim();
    if (recortado.length === 0 || recortado.length > LARGO_MAXIMO_NOMBRE) throw new NombreInvalido(LARGO_MAXIMO_NOMBRE);
    return new NombreCuenta(recortado);
  }
}
