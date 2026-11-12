import { Injectable } from "@nestjs/common";
import type { ComandoPreparacion } from "../../modules/datos/dominio/tipo-recurso-datos";
import { RecursosDatosPuerto, type EspecRecursoDatos } from "../../modules/datos/puertos/recursos-datos.puerto";

/**
 * Docker falso para los recursos de datos: recuerda contenedores, volúmenes y redes como Docker,
 * con las mismas reglas de idempotencia que el adaptador real (L).
 */
@Injectable()
export class RecursosDatosStub extends RecursosDatosPuerto {
  readonly creados: EspecRecursoDatos[] = [];
  readonly preparados: { contenedor: string; comandos: readonly ComandoPreparacion[] }[] = [];
  readonly volumenes = new Set<string>();
  /** Contenedor → redes a las que está conectado. */
  readonly redes = new Map<string, Set<string>>();
  readonly corriendo = new Set<string>();
  readonly eliminados: string[] = [];
  readonly proyectosLiberados: string[] = [];
  /** MB que devuelve `medirUsoMb` por contenedor. */
  readonly usoMb = new Map<string, number>();
  /** Si tiene valor, `preparar` lanza este error (imagen que no arranca). */
  falloPreparacion: Error | null = null;

  async crear(espec: EspecRecursoDatos): Promise<void> {
    this.creados.push(espec);
    this.volumenes.add(espec.volumen);
    this.redes.set(espec.nombre, new Set([espec.red, ...espec.redesCompartidas]));
    this.corriendo.add(espec.nombre);
  }

  async preparar(contenedor: string, comandos: readonly ComandoPreparacion[]): Promise<void> {
    this.preparados.push({ contenedor, comandos });
    if (this.falloPreparacion) throw this.falloPreparacion;
  }

  async conectar(contenedor: string, red: string): Promise<void> {
    this.redes.get(contenedor)?.add(red);
  }

  async desconectar(contenedor: string, red: string): Promise<void> {
    this.redes.get(contenedor)?.delete(red);
  }

  async iniciar(contenedor: string): Promise<void> {
    if (this.redes.has(contenedor)) this.corriendo.add(contenedor);
  }

  async detener(contenedor: string): Promise<void> {
    this.corriendo.delete(contenedor);
  }

  async eliminar(contenedor: string, volumen: string): Promise<void> {
    this.eliminados.push(contenedor);
    this.redes.delete(contenedor);
    this.corriendo.delete(contenedor);
    this.volumenes.delete(volumen);
  }

  async liberarProyecto(subdominio: string, red: string): Promise<void> {
    this.proyectosLiberados.push(subdominio);
    for (const espec of this.creados.filter((e) => e.subdominioDueno === subdominio)) await this.eliminar(espec.nombre, espec.volumen);
    for (const redes of this.redes.values()) redes.delete(red);
  }

  async medirUsoMb(contenedor: string): Promise<number | null> {
    return this.corriendo.has(contenedor) ? (this.usoMb.get(contenedor) ?? 0) : null;
  }

  conectadoA(contenedor: string, red: string): boolean {
    return this.redes.get(contenedor)?.has(red) ?? false;
  }
}
