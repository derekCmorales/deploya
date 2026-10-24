import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { ErrorAdministracion } from "./dominio/errores";

/** HTTP de cada error de dominio de M9; lo que no está aquí es 422. */
export const ESTADO_HTTP_POR_CODIGO: Record<string, HttpStatus> = {
  UsuarioNoEncontrado: HttpStatus.NOT_FOUND,
  NoSePuedeSuspenderAdministrador: HttpStatus.FORBIDDEN,
  CuentaYaSuspendida: HttpStatus.CONFLICT,
  CuentaNoSuspendida: HttpStatus.CONFLICT,
  MotivoInvalido: HttpStatus.BAD_REQUEST,
  DetalleInvalido: HttpStatus.BAD_REQUEST,
  ConsultaInvalida: HttpStatus.BAD_REQUEST,
  InstalacionSoloAutoalojada: HttpStatus.NOT_FOUND,
  AjusteInvalido: HttpStatus.BAD_REQUEST,
  InvitacionNoEncontrada: HttpStatus.NOT_FOUND,
  RegistroCerrado: HttpStatus.FORBIDDEN,
  InvitacionRequerida: HttpStatus.FORBIDDEN,
  InvitacionNoValida: HttpStatus.GONE,
};

/** Traduce los errores de dominio de M9 a `{ codigo, mensaje }` en el borde. */
@Catch(ErrorAdministracion)
export class ErroresAdministracionFilter implements ExceptionFilter {
  catch(error: ErrorAdministracion, host: ArgumentsHost): void {
    const estado = ESTADO_HTTP_POR_CODIGO[error.codigo] ?? HttpStatus.UNPROCESSABLE_ENTITY;
    host.switchToHttp().getResponse<Response>().status(estado).json({ codigo: error.codigo, mensaje: error.message });
  }
}
