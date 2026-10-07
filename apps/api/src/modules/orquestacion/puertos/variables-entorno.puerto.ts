/**
 * Variables del proyecto ya descifradas, listas para el contenedor (M3-03 → M5). El adaptador
 * envuelve `VariablesProyectoService.descifradasDe` de M3. Lanza `VariablesIlegibles`.
 */
export abstract class VariablesEntornoPuerto {
  abstract deProyecto(proyectoId: string): Promise<Record<string, string>>;
}
