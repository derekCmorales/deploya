import { Module } from "@nestjs/common";
import { porModo } from "../../suscripciones/modo/modo-instalacion";
import { SuscripcionesModule } from "../../suscripciones/suscripciones.module";
import { RepositorioInvitacionesPrisma } from "./adaptadores/repositorio-invitaciones.prisma";
import { TokensInvitacionCripto } from "./adaptadores/tokens-invitacion.cripto";
import { PoliticaRegistroPuerto } from "./puertos/politica-registro.puerto";
import { RepositorioInvitaciones } from "./puertos/repositorio-invitaciones.puerto";
import { TokensInvitacion } from "./puertos/tokens-invitacion.puerto";
import { RegistroAbierto, RegistroDeInstalacion } from "./registro-instalacion";

/**
 * Política de registro (SP-18) para M1. Módulo aparte de `AdministracionModule`, que importa
 * `IdentidadModule`: así identidad puede importar este sin ciclo de módulos.
 */
@Module({
  imports: [SuscripcionesModule],
  providers: [
    { provide: RepositorioInvitaciones, useClass: RepositorioInvitacionesPrisma },
    { provide: TokensInvitacion, useClass: TokensInvitacionCripto },
    ...porModo(PoliticaRegistroPuerto, { nube: RegistroAbierto, autoalojado: RegistroDeInstalacion }),
  ],
  exports: [PoliticaRegistroPuerto, RepositorioInvitaciones, TokensInvitacion],
})
export class RegistroInstalacionModule {}
