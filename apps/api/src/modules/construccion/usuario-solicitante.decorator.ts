import { createParamDecorator, UnauthorizedException, type ExecutionContext } from "@nestjs/common";

interface SolicitudConUsuario {
  usuario?: { id?: string };
}

/**
 * Id del usuario con sesión. Puente hasta que M1 publique `SesionGuard` y
 * `@UsuarioActual()` (martes 12:00): sin usuario en la solicitud responde 401,
 * así que ninguna ruta del motor queda abierta mientras tanto.
 */
export const UsuarioSolicitante = createParamDecorator((_dato: unknown, contexto: ExecutionContext): string => {
  const solicitud = contexto.switchToHttp().getRequest<SolicitudConUsuario>();
  const id = solicitud.usuario?.id;
  if (!id) throw new UnauthorizedException("Se requiere sesión");
  return id;
});
