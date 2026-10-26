/** Riesgo del design.md: 5 intentos fallidos de código por IP cada 15 min. */
export const MAXIMO_INTENTOS_CODIGO = 5;
export const VENTANA_INTENTOS_MS = 15 * 60 * 1000;

/**
 * Regla pura contra la fuerza bruta del código: cuenta los fallos de cada origen dentro de la
 * ventana. Vive en memoria: la API es un solo proceso y el código vence a los 30 min.
 */
export class LimiteIntentos {
  private readonly fallos = new Map<string, Date[]>();

  constructor(
    private readonly maximo = MAXIMO_INTENTOS_CODIGO,
    private readonly ventanaMs = VENTANA_INTENTOS_MS,
  ) {}

  /** Segundos que faltan para volver a intentar; 0 si puede. */
  espera(origen: string, ahora: Date): number {
    const recientes = this.recientes(origen, ahora);
    if (recientes.length < this.maximo) return 0;
    return Math.ceil((recientes[0].getTime() + this.ventanaMs - ahora.getTime()) / 1000);
  }

  registrarFallo(origen: string, ahora: Date): void {
    this.fallos.set(origen, [...this.recientes(origen, ahora), ahora]);
  }

  private recientes(origen: string, ahora: Date): Date[] {
    return (this.fallos.get(origen) ?? []).filter((en) => ahora.getTime() - en.getTime() < this.ventanaMs);
  }
}
