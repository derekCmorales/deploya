export abstract class ProveedorFuente {
  abstract verificarRepositorio(url: string, rama: string): Promise<any>;
}

