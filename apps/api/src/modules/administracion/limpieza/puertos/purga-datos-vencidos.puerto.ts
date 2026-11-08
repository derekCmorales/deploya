/**
 * Borra filas vencidas de tres tablas (EST-01b). Tres métodos estrechos: cada uno recibe solo
 * fechas de corte (las calcula `cortesDeLimpieza`) y devuelve cuántas filas borró. No toca
 * ninguna otra tabla. Prisma en compose, memoria en pruebas.
 */
export abstract class PurgaDatosVencidosPuerto {
  /** `TokenCuenta` (M1) con `usadoEn` o `expira` antes de `antesDe`. */
  abstract purgarTokensCuenta(antesDe: Date): Promise<number>;
  /** `Sesion` (M1) con `revocadaEn` antes de `revocadasAntesDe` o `ultimaActividad` antes de `inactivasAntesDe`. */
  abstract purgarSesiones(revocadasAntesDe: Date, inactivasAntesDe: Date): Promise<number>;
  /** `Invitacion` (M9) con `usada`, `revocada` o `vence` antes de `antesDe`. */
  abstract purgarInvitaciones(antesDe: Date): Promise<number>;
}
