import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseFilters, UseGuards } from "@nestjs/common";
import { RolGuard } from "../identidad/rol.guard";
import { Roles } from "../identidad/roles.decorator";
import { SesionGuard } from "../identidad/sesion.guard";
import { UsuarioActual } from "../identidad/usuario-actual.decorator";
import { UsuarioNoEncontrado } from "./dominio/errores";
import { MOTIVOS_SUSPENSION, validarSolicitudSuspension } from "./dominio/suspension";
import { validarFiltroUsuarios, type DetalleUsuario, type PaginaUsuarios } from "./dominio/usuarios";
import { ErroresAdministracionFilter } from "./errores-administracion.filter";
import { ConsultaUsuariosPuerto } from "./puertos/consulta-usuarios.puerto";
import { SuspensionService } from "./suspension.service";

/** Pantallas 25 y 25b (M9-01, M9-02). Todo detrás de `SesionGuard` + `RolGuard` (solo administración). */
@Controller("admin/usuarios")
@UseGuards(SesionGuard, RolGuard)
@Roles("administrador")
@UseFilters(ErroresAdministracionFilter)
export class UsuariosAdminController {
  constructor(
    private readonly consulta: ConsultaUsuariosPuerto,
    private readonly suspension: SuspensionService,
  ) {}

  @Get()
  buscar(@Query() consulta: unknown): Promise<PaginaUsuarios> {
    return this.consulta.buscar(validarFiltroUsuarios(consulta));
  }

  /** La lista de 25b: clave y texto que verá el usuario en 03b. */
  @Get("motivos-suspension")
  motivos(): { motivos: { clave: string; texto: string }[] } {
    return { motivos: Object.entries(MOTIVOS_SUSPENSION).map(([clave, texto]) => ({ clave, texto })) };
  }

  @Get(":id")
  async detalle(@Param("id") id: string): Promise<DetalleUsuario> {
    const detalle = await this.consulta.detalle(id);
    if (!detalle) throw new UsuarioNoEncontrado(id);
    return detalle;
  }

  @Post(":id/suspension")
  @HttpCode(HttpStatus.NO_CONTENT)
  suspender(@UsuarioActual("id") adminId: string, @Param("id") id: string, @Body() cuerpo: unknown): Promise<void> {
    return this.suspension.suspender(adminId, id, validarSolicitudSuspension(cuerpo));
  }
}
