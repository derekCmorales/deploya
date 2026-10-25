/** Sondeo periódico con un reloj inyectable para poder probarlo sin esperar 60 s. */

export interface Sondeo {
  detener: () => void;
}

export type ProgramarSondeo = (accion: () => void, ms: number) => ReturnType<typeof setTimeout>;
export type CancelarSondeo = (temporizador: ReturnType<typeof setTimeout> | undefined) => void;

/**
 * Pide una vez y vuelve a programar tanto si la petición sale bien como si falla.
 * El llamador decide qué hacer con cada resultado; el sondeo nunca se detiene solo.
 */
export function iniciarSondeo(
  pedir: () => Promise<void>,
  intervaloMs: number,
  programar: ProgramarSondeo = (accion, ms) => setTimeout(accion, ms),
  cancelar: CancelarSondeo = (temporizador) => {
    if (temporizador !== undefined) clearTimeout(temporizador);
  },
): Sondeo {
  let vigente = true;
  let temporizador: ReturnType<typeof setTimeout> | undefined;

  const ciclo = async (): Promise<void> => {
    try {
      await pedir();
    } catch {
      // El error lo reporta `pedir`; el sondeo sigue para que la pantalla se recupere.
    }
    if (vigente) temporizador = programar(ciclo, intervaloMs);
  };

  void ciclo();

  return {
    detener() {
      vigente = false;
      cancelar(temporizador);
    },
  };
}
