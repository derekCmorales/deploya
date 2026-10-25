import { Injectable, type CanActivate } from "@nestjs/common";
import { CatalogoPlanes } from "./catalogo-planes.puerto";

/** Las rutas de cobro (07, 08, 09) solo existen si el catálogo vende: en autoalojado, 404. */
@Injectable()
export class CobroDisponibleGuard implements CanActivate {
  constructor(private readonly catalogo: CatalogoPlanes) {}

  canActivate(): boolean {
    this.catalogo.exigirCobro();
    return true;
  }
}
