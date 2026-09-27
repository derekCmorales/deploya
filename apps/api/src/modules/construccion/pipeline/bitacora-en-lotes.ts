import type { Reloj } from "../../../compartido/reloj";
import type { LineaBitacora } from "../dominio/despliegue";
import type { Etapa, NivelBitacora } from "../dominio/estados";
import { LARGO_MAXIMO_LINEA, LOTE_BITACORA_LINEAS } from "../dominio/motor.constantes";
import type { RepositorioDespliegues } from "../puertos/repositorio-despliegues.puerto";

/**
 * Junta líneas de bitácora y las persiste por lotes (ADR 0006): una escritura por
 * lote y no una por cada línea de `docker build`. Las escrituras se encadenan para
 * conservar el orden de `n`.
 */
export class BitacoraEnLotes {
  private pendientes: LineaBitacora[] = [];
  private escritura: Promise<void> = Promise.resolve();
  private temporizador: NodeJS.Timeout | null = null;

  constructor(
    private readonly repositorio: RepositorioDespliegues,
    private readonly reloj: Reloj,
    private readonly despliegueId: string,
    private ultimoN = 0,
    private readonly tamanoLote = LOTE_BITACORA_LINEAS,
  ) {}

  escribir(etapa: Etapa, texto: string, nivel: NivelBitacora = "info"): void {
    this.ultimoN += 1;
    this.pendientes.push({ n: this.ultimoN, marca: this.reloj.ahora(), etapa, nivel, texto: texto.slice(0, LARGO_MAXIMO_LINEA) });
    if (this.pendientes.length >= this.tamanoLote) void this.vaciar();
  }

  vaciar(): Promise<void> {
    if (this.pendientes.length > 0) {
      const lote = this.pendientes;
      this.pendientes = [];
      this.escritura = this.escritura.then(() => this.repositorio.agregarLineas(this.despliegueId, lote));
    }
    return this.escritura;
  }

  /** Vacía cada `intervaloMs` para que el panel vea avance aunque el lote no se llene. */
  vaciarCada(intervaloMs: number): void {
    this.temporizador = setInterval(() => void this.vaciar(), intervaloMs);
    this.temporizador.unref();
  }

  async cerrar(): Promise<void> {
    if (this.temporizador) clearInterval(this.temporizador);
    await this.vaciar();
  }
}
