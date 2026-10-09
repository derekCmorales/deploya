import { Injectable } from '@nestjs/common';
import { CifradorVariables } from '../puertos/cifrador-variables.puerto';
import { RepositorioVariables } from '../puertos/repositorio-variables.puerto';
import { validarConjuntoVariables } from '../dominio/variable';

@Injectable()
export class VariablesProyectoService {
  constructor(
    private readonly cifrador: CifradorVariables,
    private readonly repositorio: RepositorioVariables,
  ) {}

  async listarVariables(proyectoId: string): Promise<{ clave: string; valor: string }[]> {
    const persistidas = await this.repositorio.obtenerPorProyecto(proyectoId);
    return persistidas.map((v) => ({
      clave: v.clave,
      valor: this.cifrador.descifrar(v.valorCifrado),
    }));
  }

  async guardarVariables(proyectoId: string, entradas: { clave: string; valor: string }[]): Promise<void> {
    validarConjuntoVariables(entradas);

    const aGuardar = entradas.map((e) => ({
      clave: e.clave,
      valorCifrado: this.cifrador.cifrar(e.valor),
    }));

    await this.repositorio.guardarConjunto(proyectoId, aGuardar);
  }
}