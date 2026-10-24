import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseFilters, UseGuards } from "@nestjs/common";
import { RolGuard } from "../../identidad/rol.guard";
import { Roles } from "../../identidad/roles.decorator";
import { SesionGuard } from "../../identidad/sesion.guard";
import { UsuarioActual } from "../../identidad/usuario-actual.decorator";
import { ErroresAdministracionFilter } from "../errores-administracion.filter";
import { InstalacionService, type EstadoInstalacion, type LimitesVista } from "./instalacion.service";
import { InvitacionesService, type InvitacionCreada } from "./invitaciones.service";
import { SoloAutoalojadaGuard } from "./solo-autoalojada.guard";

/** Pantalla 32 (SP-18). Sesión, rol Administrador y solo en autoalojado (404 en la nube). */
@Controller("admin")
@UseGuards(SesionGuard, RolGuard, SoloAutoalojadaGuard)
@Roles("administrador")
@UseFilters(ErroresAdministracionFilter)
export class InstalacionAdminController {
  constructor(
    private readonly instalacion: InstalacionService,
    private readonly invitaciones: InvitacionesService,
  ) {}

  /** También «Volver a comprobar»: cada lectura corre las comprobaciones. */
  @Get("instalacion")
  estado(): Promise<EstadoInstalacion> {
    return this.instalacion.estado();
  }

  @Patch("instalacion/registro")
  cambiarRegistro(@UsuarioActual("id") adminId: string, @Body() cuerpo: unknown) {
    return this.instalacion.cambiarRegistro(adminId, cuerpo);
  }

  @Patch("instalacion/limites")
  cambiarLimites(@UsuarioActual("id") adminId: string, @Body() cuerpo: unknown): Promise<LimitesVista> {
    return this.instalacion.cambiarLimites(adminId, cuerpo);
  }

  @Post("invitaciones")
  crearInvitacion(@UsuarioActual("id") adminId: string, @Body() cuerpo: unknown): Promise<InvitacionCreada> {
    return this.invitaciones.crear(adminId, cuerpo);
  }

  @Delete("invitaciones/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  revocarInvitacion(@UsuarioActual("id") adminId: string, @Param("id") id: string): Promise<void> {
    return this.invitaciones.revocar(adminId, id);
  }
}
