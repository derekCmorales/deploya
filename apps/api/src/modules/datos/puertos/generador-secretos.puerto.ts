/** El azar es una dependencia (docs/ingenieria.md §2): contraseñas de los recursos de datos. */
export abstract class GeneradorSecretos {
  /** `largo` caracteres de `[A-Za-z0-9]`: seguros en una URL sin escapar. */
  abstract contrasena(largo: number): string;
}
