import { Catch, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { ErrorDatos } from "./dominio/errores";

/** `{ codigo, mensaje }` con el estado HTTP que declara cada error de dominio (409, 404 o 400). */
@Catch(ErrorDatos)
export class ErroresDatosFilter implements ExceptionFilter {
  catch(error: ErrorDatos, host: ArgumentsHost): void {
    host.switchToHttp().getResponse<Response>().status(error.estadoHttp).json({ codigo: error.codigo, mensaje: error.message });
  }
}
