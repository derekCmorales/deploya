import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { ErrorSuscripciones } from "./dominio/errores";

/** HTTP de cada error de dominio de M2; lo que no está aquí es 422. */
export const ESTADO_HTTP_POR_CODIGO: Record<string, HttpStatus> = {
  "datos-invalidos": HttpStatus.BAD_REQUEST,
  "sin-suscripcion": HttpStatus.NOT_FOUND,
  "plan-no-encontrado": HttpStatus.NOT_FOUND,
  "vigencia-no-disponible": HttpStatus.UNPROCESSABLE_ENTITY,
  "plan-sin-cobro": HttpStatus.CONFLICT,
  "es-descenso": HttpStatus.CONFLICT,
  "descenso-no-permitido": HttpStatus.CONFLICT,
};

/** Traduce los errores de dominio de M2 a `{ codigo, mensaje, ...detalle }` en el borde. */
@Catch(ErrorSuscripciones)
export class ErroresSuscripcionesFilter implements ExceptionFilter {
  catch(error: ErrorSuscripciones, host: ArgumentsHost): void {
    const estado = ESTADO_HTTP_POR_CODIGO[error.codigo] ?? HttpStatus.UNPROCESSABLE_ENTITY;
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(estado)
      .json({ codigo: error.codigo, mensaje: error.message, ...error.detalle() });
  }
}
