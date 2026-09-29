import { createParamDecorator, UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import type { UsuarioSesion } from "./dominio/sesion";
import type { SolicitudConSesion } from "./sesion.guard";

/** Lógica del decorador, aparte para probarla sin Nest. Sin guard previo responde 401. */
export function usuarioActualDe(solicitud: SolicitudConSesion, campo?: keyof UsuarioSesion): UsuarioSesion | string {
  if (!solicitud.usuario) throw new UnauthorizedException({ codigo: "SinSesion", mensaje: "Inicia sesión para continuar." });
  return campo ? solicitud.usuario[campo] : solicitud.usuario;
}

/**
 * Usuario de la sesión que dejó `SesionGuard`. `@UsuarioActual("id")` da solo el id;
 * el usuario nunca sale del cuerpo ni de la URL.
 */
export const UsuarioActual = createParamDecorator(
  (campo: keyof UsuarioSesion | undefined, contexto: ExecutionContext): UsuarioSesion | string =>
    usuarioActualDe(contexto.switchToHttp().getRequest<SolicitudConSesion>(), campo),
);
