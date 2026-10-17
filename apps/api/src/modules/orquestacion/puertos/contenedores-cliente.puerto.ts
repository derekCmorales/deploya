import type { ResultadoMasivo } from "../dominio/accion-contenedor";

/**
 * Lo que M2 (ciclo de suscripción) y M9 (suspender cuenta) ven de M5: detener o volver a arrancar
 * todos los contenedores de un cliente, sin conocer Docker ni la cola.
 */
export abstract class ContenedoresClientePuerto {
  abstract detenerTodos(usuarioId: string): Promise<ResultadoMasivo>;
  abstract reanudarTodos(usuarioId: string): Promise<ResultadoMasivo>;
}
