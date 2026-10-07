<<<<<<< HEAD
import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import {
  UrlRepositorioInvalida,
  DatosAltaInvalidos,
  RepositorioNoAccesible,
  RamaNoEncontrada,
  RepositorioSinDockerfile,
  FuenteNoDisponible,
  SubdominioEnUso,
  LimiteProyectosAlcanzado,
} from "./dominio/errores";

@Catch(
  UrlRepositorioInvalida,
  DatosAltaInvalidos,
  RepositorioNoAccesible,
  RamaNoEncontrada,
  RepositorioSinDockerfile,
  FuenteNoDisponible,
  SubdominioEnUso,
  LimiteProyectosAlcanzado
)
export class ErroresProyectosFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let codigo = "error-interno";
    const detalle: Record<string, unknown> = {};

    if (exception instanceof UrlRepositorioInvalida || exception instanceof DatosAltaInvalidos) {
      status = HttpStatus.BAD_REQUEST;
      codigo = exception.codigo;
    } else if (exception instanceof RepositorioNoAccesible) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      codigo = exception.codigo;
      detalle.estadoHttp = exception.estadoHttp;
    } else if (exception instanceof RamaNoEncontrada) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      codigo = exception.codigo;
    } else if (exception instanceof RepositorioSinDockerfile) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      codigo = exception.codigo;
      detalle.rama = exception.rama;
    } else if (exception instanceof FuenteNoDisponible) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      codigo = exception.codigo;
    } else if (exception instanceof SubdominioEnUso || exception instanceof LimiteProyectosAlcanzado) {
      status = HttpStatus.CONFLICT;
      codigo = exception.codigo;
    }

    response.status(status).json({
      codigo,
      mensaje: exception.message,
      ...detalle,
    });
  }
}
=======
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
  "proyecto-no-encontrado": HttpStatus.NOT_FOUND,
  "confirmacion-no-coincide": HttpStatus.BAD_REQUEST,
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
>>>>>>> origin/main
