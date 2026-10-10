import { Injectable } from "@nestjs/common";
import { ClaveInvalida, ProyectoNoEncontrado, VariableIlegible } from "../dominio/errores";
import { validarConjuntoVariables, type EntradaVariable } from "../dominio/variable";
import { CifradorVariables } from "../puertos/cifrador-variables.puerto";
import { RepositorioProyectos } from "../puertos/repositorio-proyectos.puerto";
import { RepositorioVariables } from "../puertos/repositorio-variables.puerto";

export interface VariablePublica {
  clave: string;
  actualizado: string;
}

/** Fachada de M3-03. M5 solo ve `descifradasDe`. */
@Injectable()
export class VariablesProyectoService {
  constructor(
    private readonly cifrador: CifradorVariables,
    private readonly variables: RepositorioVariables,
    private readonly proyectos: RepositorioProyectos,
  ) {}

  async listar(usuarioId: string, proyectoId: string): Promise<VariablePublica[]> {
    await this.exigirDueno(usuarioId, proyectoId);
    const filas = await this.variables.deProyecto(proyectoId);
    return filas.map((fila) => ({ clave: fila.clave, actualizado: fila.actualizado.toISOString() }));
  }

  async mostrar(usuarioId: string, proyectoId: string, clave: string): Promise<{ clave: string; valor: string }> {
    await this.exigirDueno(usuarioId, proyectoId);
    const fila = (await this.variables.deProyecto(proyectoId)).find((variable) => variable.clave === clave);
    if (!fila) throw new ProyectoNoEncontrado(proyectoId);
    return { clave, valor: this.descifrar(fila.valorCifrado) };
  }

  async reemplazar(usuarioId: string, proyectoId: string, entradas: EntradaVariable[]): Promise<VariablePublica[]> {
    await this.exigirDueno(usuarioId, proyectoId);
    return this.escribir(proyectoId, entradas);
  }

  /** Lo que el contenedor recibe. Un valor alterado lanza `VariableIlegible`. */
  async descifradasDe(proyectoId: string): Promise<Record<string, string>> {
    const filas = await this.variables.deProyecto(proyectoId);
    return Object.fromEntries(filas.map((fila) => [fila.clave, this.descifrar(fila.valorCifrado)]));
  }

  private async escribir(proyectoId: string, entradas: EntradaVariable[]): Promise<VariablePublica[]> {
    validarConjuntoVariables(entradas);
    const previas = new Map((await this.variables.deProyecto(proyectoId)).map((fila) => [fila.clave, fila.valorCifrado]));
    const guardadas = await this.variables.reemplazar(proyectoId, entradas.map((entrada) => this.aNueva(entrada, previas)));
    return guardadas.map((fila) => ({ clave: fila.clave, actualizado: fila.actualizado.toISOString() }));
  }

  private aNueva(entrada: EntradaVariable, previas: Map<string, string>): { clave: string; valorCifrado: string } {
    if (entrada.valor === undefined) return { clave: entrada.clave, valorCifrado: this.conservar(previas, entrada.clave) };
    return { clave: entrada.clave, valorCifrado: this.cifrador.cifrar(entrada.valor) };
  }

  private conservar(previas: Map<string, string>, clave: string): string {
    const cifrado = previas.get(clave);
    if (!cifrado) throw new ClaveInvalida(`La variable ${clave} es nueva y necesita un valor.`);
    return cifrado;
  }

  private descifrar(valorCifrado: string): string {
    try {
      return this.cifrador.descifrar(valorCifrado);
    } catch (error) {
      if (error instanceof VariableIlegible) throw error;
      throw new VariableIlegible();
    }
  }

  private async exigirDueno(usuarioId: string, proyectoId: string): Promise<void> {
    const proyecto = await this.proyectos.porId(proyectoId);
    if (!proyecto || proyecto.usuarioId !== usuarioId) throw new ProyectoNoEncontrado(proyectoId);
  }
}
