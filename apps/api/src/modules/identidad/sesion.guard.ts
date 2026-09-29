import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { COOKIE_SESION, leerCookie } from "./cookie-sesion";
import type { UsuarioSesion } from "./dominio/sesion";
import { SesionService } from "./sesion.service";

export interface SolicitudConSesion {
  headers: { cookie?: string };
  usuario?: UsuarioSesion;
}

/**
 * Guard de M1-03 para el resto de módulos: sin cookie de una sesión vigente responde 401
 * y, si la hay, deja el usuario en `request.usuario` para `@UsuarioActual()`.
 */
@Injectable()
export class SesionGuard implements CanActivate {
  constructor(private readonly sesiones: SesionService) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const solicitud = contexto.switchToHttp().getRequest<SolicitudConSesion>();
    const token = leerCookie(solicitud.headers.cookie, COOKIE_SESION);
    const usuario = token ? await this.sesiones.usuarioDe(token) : null;
    if (!usuario) throw new UnauthorizedException({ codigo: "SinSesion", mensaje: "Inicia sesión para continuar." });
    solicitud.usuario = usuario;
    return true;
  }
}
