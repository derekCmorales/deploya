import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { ErrorProyectos } from "./dominio/errores";

/** HTTP de cada error de dominio de M3; lo que no está aquí es 422. */
export const ESTADO_HTTP_POR_CODIGO: Record<string, HttpStatus> = {
  "url-invalida": HttpStatus.BAD_REQUEST,
  "datos-invalidos": HttpStatus.BAD_REQUEST,
  "repositorio-no-accesible": HttpStatus.UNPROCESSABLE_ENTITY,
  "rama-no-encontrada": HttpStatus.UNPROCESSABLE_ENTITY,
  "sin-dockerfile": HttpStatus.UNPROCESSABLE_ENTITY,
  "fuente-no-disponible": HttpStatus.SERVICE_UNAVAILABLE,
  "subdominio-en-uso": HttpStatus.CONFLICT,
  "limite-proyectos": HttpStatus.CONFLICT,
};

/** Traduce los errores de dominio de M3 a `{ codigo, mensaje, ...detalle }` en el borde. */
@Catch(ErrorProyectos)
export class ErroresProyectosFilter implements ExceptionFilter {
  catch(error: ErrorProyectos, host: ArgumentsHost): void {
    const estado = ESTADO_HTTP_POR_CODIGO[error.codigo] ?? HttpStatus.UNPROCESSABLE_ENTITY;
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(estado)
      .json({ codigo: error.codigo, mensaje: error.message, ...error.detalle() });
  }
}
