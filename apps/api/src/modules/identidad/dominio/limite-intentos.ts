const MS_POR_SEGUNDO = 1000;

/**
 * Regla pura contra la fuerza bruta (Policy): cuenta los intentos de cada clave (IP, IP y correo,
 * o correo) dentro de una ventana. Vive en memoria: la API es un solo proceso (ADR 0002) y un
 * reinicio solo pone los conteos en cero. El reloj lo pasa quien llama; aquí no hay `Date.now()`.
 */
export class LimiteIntentos {
  private readonly intentos = new Map<string, Date[]>();

  constructor(
    readonly maximo: number,
    readonly ventanaMs: number,
  ) {}

  /** Segundos que faltan para volver a intentar; 0 si puede. */
  espera(clave: string, ahora: Date): number {
    const recientes = this.recientes(clave, ahora);
    if (recientes.length < this.maximo) return 0;
    return Math.ceil((recientes[0].getTime() + this.ventanaMs - ahora.getTime()) / MS_POR_SEGUNDO);
  }

  registrar(clave: string, ahora: Date): void {
    this.intentos.set(clave, [...this.recientes(clave, ahora), ahora]);
  }

  /** Un inicio de sesión correcto pone el conteo de esa clave en cero. */
  limpiar(clave: string): void {
    this.intentos.delete(clave);
  }

  /** Lo vencido se descarta al leer; una clave sin intentos recientes deja de ocupar memoria. */
  private recientes(clave: string, ahora: Date): Date[] {
    const vigentes = (this.intentos.get(clave) ?? []).filter((en) => ahora.getTime() - en.getTime() < this.ventanaMs);
    if (vigentes.length === 0) this.intentos.delete(clave);
    return vigentes;
  }
}
