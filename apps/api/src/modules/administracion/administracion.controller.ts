import { Controller, Get, UseGuards } from "@nestjs/common";
import type { UsuarioSesion } from "../identidad/dominio/sesion";
import { RolGuard } from "../identidad/rol.guard";
import { Roles } from "../identidad/roles.decorator";
import { SesionGuard } from "../identidad/sesion.guard";
import { UsuarioActual } from "../identidad/usuario-actual.decorator";

@Controller("administracion")
export class AdministracionController {
  @Get("health")
  health() {
    return { status: "ok", module: "administracion" };
  }

  /**
   * M1-04: la web pregunta aquí antes de mostrar `/admin`. Un Cliente recibe 403
   * `SoloAdministracion` (pantalla 28). Las rutas de M9 (Avance 3) usan los mismos guards.
   */
  @Get("acceso")
  @UseGuards(SesionGuard, RolGuard)
  @Roles("administrador")
  acceso(@UsuarioActual() usuario: UsuarioSesion): { usuario: UsuarioSesion } {
    return { usuario };
  }
}
