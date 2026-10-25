import { createHash, timingSafeEqual } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import { CodigoInvalido, CodigoVencido, PrimeraConfiguracionNoDisponible } from "../dominio/errores";
import { AltaPrimerUsuario } from "./alta-primer-usuario.puerto";
import type { CodigoConfiguracion } from "./configuracion-instalacion";
import { RepositorioConfiguracionInstalacion } from "./repositorio-configuracion-instalacion.puerto";

/** sha256 hex del texto exacto, guion incluido: lo mismo que calcula `instalar.sh`. */
export function hashDeCodigo(codigo: string): string {
  return createHash("sha256").update(codigo).digest("hex");
}

/** Regla pura del código de configuración: mismo hash y sin vencer. */
export function verificarCodigo(guardado: CodigoConfiguracion | null, hashDado: string, ahora: Date): void {
  if (!guardado) throw new CodigoInvalido();
  const esperado = Buffer.from(guardado.hashCodigo);
  const dado = Buffer.from(hashDado);
  if (esperado.length !== dado.length || !timingSafeEqual(esperado, dado)) throw new CodigoInvalido();
  if (guardado.codigoVence.getTime() <= ahora.getTime()) throw new CodigoVencido();
}

/** Nube: el administrador lo crea el seed; toda alta es Cliente y no hay primera configuración. */
@Injectable()
export class ComoCliente extends AltaPrimerUsuario {
  async configurada(): Promise<boolean> {
    return true;
  }

  async validarCodigo(): Promise<void> {
    throw new PrimeraConfiguracionNoDisponible();
  }

  async consumirCodigo(): Promise<void> {
    throw new PrimeraConfiguracionNoDisponible();
  }
}

/**
 * Autoalojado: el primer administrador solo nace del código que imprime el instalador. Quien se
 * registra antes es Cliente y la instalación sigue sin administrador.
 */
@Injectable()
export class ConCodigoDeConfiguracion extends AltaPrimerUsuario {
  constructor(
    private readonly configuracion: RepositorioConfiguracionInstalacion,
    private readonly reloj: Reloj,
  ) {
    super();
  }

  configurada(): Promise<boolean> {
    return this.configuracion.hayAdministrador();
  }

  async validarCodigo(codigo: string): Promise<void> {
    await this.exigirSinAdministrador();
    verificarCodigo(await this.configuracion.codigo(), hashDeCodigo(codigo.trim()), this.reloj.ahora());
  }

  async consumirCodigo(): Promise<void> {
    await this.exigirSinAdministrador();
    await this.configuracion.borrarCodigo();
  }

  private async exigirSinAdministrador(): Promise<void> {
    if (await this.configuracion.hayAdministrador()) throw new PrimeraConfiguracionNoDisponible();
  }
}
