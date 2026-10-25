import { Inject, Injectable, type CanActivate } from "@nestjs/common";
import { MODO_INSTALACION, type ModoInstalacion } from "../../suscripciones/modo/modo-instalacion";
import { InstalacionSoloAutoalojada } from "../dominio/errores";

/** Qué modo tiene Admin · Instalación: tabla, no rama (un modo nuevo es una fila). */
const ADMINISTRABLE: Record<ModoInstalacion, boolean> = { nube: false, autoalojado: true };

/** Admin · Instalación (32) solo existe en autoalojado: en la nube responde 404. */
@Injectable()
export class SoloAutoalojadaGuard implements CanActivate {
  constructor(@Inject(MODO_INSTALACION) private readonly modo: ModoInstalacion) {}

  canActivate(): boolean {
    if (!ADMINISTRABLE[this.modo]) throw new InstalacionSoloAutoalojada();
    return true;
  }
}
