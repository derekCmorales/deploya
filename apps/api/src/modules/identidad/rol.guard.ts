import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Rol } from "./dominio/cuenta";
import { ROLES_PERMITIDOS } from "./roles.decorator";
import type { SolicitudConSesion } from "./sesion.guard";

/**
 * Pantalla 28 · 403: el cuerpo que lee la web para mostrar «solo para administración».
 * El núcleo solo restringe a administración; si aparece otro rol restringido, este cuerpo
 * debe depender del rol exigido.
 */
export const SOLO_ADMINISTRACION = {
  codigo: "SoloAdministracion",
  mensaje: "Esta sección es solo para administración",
} as const;

/** La ruta pide un rol solo si `@Roles()` trae al menos uno. */
export function exigeRol(permitidos: readonly Rol[] | undefined): permitidos is readonly Rol[] {
  return permitidos !== undefined && permitidos.length > 0;
}

/** Decisión pura, aparte para probarla sin Nest: sin roles exigidos, cualquiera con sesión pasa. */
export function rolPermitido(rol: Rol, permitidos: readonly Rol[] | undefined): boolean {
  return !exigeRol(permitidos) || permitidos.includes(rol);
}

/**
 * Guard de rol de M1-04 (Chain of Responsibility con `SesionGuard`): se usa como
 * `@UseGuards(SesionGuard, RolGuard)`. `SesionGuard` ya dejó `request.usuario`; este solo
 * compara su rol con los de `@Roles()` de la ruta o del controlador.
 */
@Injectable()
export class RolGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const permitidos = this.reflector.getAllAndOverride<Rol[] | undefined>(ROLES_PERMITIDOS, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (!exigeRol(permitidos)) return true;

    const { usuario } = contexto.switchToHttp().getRequest<SolicitudConSesion>();
    if (!usuario) throw new UnauthorizedException({ codigo: "SinSesion", mensaje: "Inicia sesión para continuar." });
    if (!rolPermitido(usuario.rol, permitidos)) throw new ForbiddenException(SOLO_ADMINISTRACION);
    return true;
  }
}
