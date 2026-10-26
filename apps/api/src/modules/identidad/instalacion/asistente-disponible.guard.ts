import { Inject, Injectable, type CanActivate } from "@nestjs/common";
import { PrimeraConfiguracionNoDisponible } from "../../suscripciones/dominio/errores";
import { MODO_INSTALACION, type ModoInstalacion } from "../../suscripciones/modo/modo-instalacion";

/** Dónde existe el asistente: tabla, no rama (un modo nuevo es una fila). */
const CON_ASISTENTE: Record<ModoInstalacion, boolean> = { nube: false, autoalojado: true };

/**
 * Va antes de `SesionGuard` en los endpoints de correo del asistente: en la nube responden 404,
 * no 401 (contrato instalacion.md). El código y el administrador ya dan 404 por `AltaPrimerUsuario`.
 */
@Injectable()
export class AsistenteDisponibleGuard implements CanActivate {
  constructor(@Inject(MODO_INSTALACION) private readonly modo: ModoInstalacion) {}

  canActivate(): boolean {
    if (!CON_ASISTENTE[this.modo]) throw new PrimeraConfiguracionNoDisponible();
    return true;
  }
}
