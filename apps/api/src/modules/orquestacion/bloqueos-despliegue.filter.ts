import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { BloqueoDespliegue } from "./dominio/errores";

/**
 * 409 `{ codigo, mensaje }` del contrato v2.1 para cualquier ruta que pida una construcción
 * (desplegar, alta de M3, guardar y desplegar variables). Se registra como filtro global.
 */
@Catch(BloqueoDespliegue)
export class BloqueosDespliegueFilter implements ExceptionFilter {
  catch(error: BloqueoDespliegue, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(HttpStatus.CONFLICT)
      .json({ codigo: error.codigo, mensaje: error.message });
  }
}
