import { RepositorioVariables, VariablePersistida } from '../puertos/repositorio-variables.puerto';

export class RepositorioVariablesMemoria extends RepositorioVariables {
  private almacenamiento = new Map<string, VariablePersistida[]>();

  async obtenerPorProyecto(proyectoId: string): Promise<VariablePersistida[]> {
    return this.almacenamiento.get(proyectoId) || [];
  }

  async guardarConjunto(proyectoId: string, variables: { clave: string; valorCifrado: string }[]): Promise<void> {
    const ahora = new Date();
    const persistidas: VariablePersistida[] = variables.map((v, index) => ({
      id: `var-${index}-${Date.now()}`,
      proyectoId,
      clave: v.clave,
      valorCifrado: v.valorCifrado,
      creadoEn: ahora,
      actualizadoEn: ahora,
    }));
    this.almacenamiento.set(proyectoId, persistidas);
  }

  async eliminarPorProyecto(proyectoId: string): Promise<void> {
    this.almacenamiento.delete(proyectoId);
  }
}