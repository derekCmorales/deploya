import { createParamDecorator, UnauthorizedException, type ExecutionContext } from "@nestjs/common";

interface SolicitudConUsuario {
  usuario?: { id?: string };
}

/**
 * Usuario de desarrollo mientras M1 no publica `SesionGuard` (martes 12:00): solo si
 * `USUARIO_DESARROLLO` está definida y NODE_ENV no es `production`. La imagen de
 * Docker corre en `production`, así que en compose y en el VPS nunca aplica.
 */
export function usuarioDeDesarrollo(entorno: NodeJS.ProcessEnv): string | null {
  if (entorno.NODE_ENV === "production") return null;
  return entorno.USUARIO_DESARROLLO || null;
}

export function usuarioDe(solicitud: SolicitudConUsuario, entorno: NodeJS.ProcessEnv): string {
  const id = solicitud.usuario?.id ?? usuarioDeDesarrollo(entorno);
  if (!id) throw new UnauthorizedException("Se requiere sesión");
  return id;
}

/**
 * Id del usuario con sesión (`request.usuario.id`, lo pone el guard de M1). Sin
 * usuario responde 401, así que ninguna ruta del motor queda abierta.
 */
export const UsuarioSolicitante = createParamDecorator((_dato: unknown, contexto: ExecutionContext): string =>
  usuarioDe(contexto.switchToHttp().getRequest<SolicitudConUsuario>(), process.env),
);
