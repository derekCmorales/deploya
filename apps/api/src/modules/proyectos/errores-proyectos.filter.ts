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