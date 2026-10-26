import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { CorreoDePruebaRechazado, DatosCorreoInvalidos, DemasiadosIntentosCodigo } from "./errores";

/** HTTP de los errores propios del asistente; `codigo` es lo que lee la web. */
@Catch(DemasiadosIntentosCodigo, DatosCorreoInvalidos, CorreoDePruebaRechazado)
export class ErroresInstalacionFilter implements ExceptionFilter {
  catch(error: DemasiadosIntentosCodigo | DatosCorreoInvalidos | CorreoDePruebaRechazado, host: ArgumentsHost): void {
    const respuesta = host.switchToHttp().getResponse<Response>();
    const cuerpo = { codigo: error.name, mensaje: error.message };
    if (error instanceof DemasiadosIntentosCodigo) {
      respuesta.status(HttpStatus.TOO_MANY_REQUESTS).json({ ...cuerpo, segundos: error.segundos });
      return;
    }
    if (error instanceof DatosCorreoInvalidos) {
      respuesta.status(HttpStatus.BAD_REQUEST).json({ ...cuerpo, campo: error.campo });
      return;
    }
    // Contrato: 502 { error } con lo que respondió el servidor SMTP.
    respuesta.status(HttpStatus.BAD_GATEWAY).json({ ...cuerpo, error: error.error });
  }
}
