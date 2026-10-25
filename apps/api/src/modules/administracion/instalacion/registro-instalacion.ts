import { Injectable } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import { RepositorioConfiguracionInstalacion } from "../../suscripciones/modo/repositorio-configuracion-instalacion.puerto";
import { InvitacionNoValida, InvitacionRequerida, RegistroCerrado } from "../dominio/errores";
import { exigirUsable, type Invitacion } from "./dominio/invitacion";
import { PoliticaRegistroPuerto } from "./puertos/politica-registro.puerto";
import { RepositorioInvitaciones } from "./puertos/repositorio-invitaciones.puerto";
import { TokensInvitacion } from "./puertos/tokens-invitacion.puerto";

/** Nube: el registro es abierto, como hasta hoy. */
@Injectable()
export class RegistroAbierto extends PoliticaRegistroPuerto {
  async exigirPermitido(): Promise<void> {}

  async consumir(): Promise<void> {}
}

/**
 * Autoalojado (SP-18): abierto, con invitación o cerrado, según la 32. Con invitación, el enlace
 * tiene que ser del mismo correo, sin usar, sin revocar y sin vencer.
 */
@Injectable()
export class RegistroDeInstalacion extends PoliticaRegistroPuerto {
  constructor(
    private readonly configuracion: RepositorioConfiguracionInstalacion,
    private readonly invitaciones: RepositorioInvitaciones,
    private readonly tokens: TokensInvitacion,
    private readonly reloj: Reloj,
  ) {
    super();
  }

  async exigirPermitido(correo: string, invitacion?: string): Promise<void> {
    const politica = await this.configuracion.politicaRegistro();
    if (politica === "cerrado") throw new RegistroCerrado();
    if (politica === "invitacion") await this.invitacionUsable(correo, invitacion);
  }

  async consumir(correo: string, invitacion?: string): Promise<void> {
    if ((await this.configuracion.politicaRegistro()) !== "invitacion") return;
    const usable = await this.invitacionUsable(correo, invitacion);
    if (!(await this.invitaciones.marcarUsada(usable.id, this.reloj.ahora()))) throw new InvitacionNoValida("usada");
  }

  private async invitacionUsable(correo: string, invitacion?: string): Promise<Invitacion> {
    if (!invitacion) throw new InvitacionRequerida();
    return exigirUsable(await this.invitaciones.porHash(this.tokens.huella(invitacion)), correo, this.reloj.ahora());
  }
}
