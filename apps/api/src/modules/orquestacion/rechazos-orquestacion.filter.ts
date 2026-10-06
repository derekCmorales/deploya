import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { RechazoOrquestacion } from "./dominio/errores";

/**
 * 409 `{ codigo, mensaje }` del contrato v2.1 en cualquier ruta: bloqueos al pedir una
 * construcción (desplegar, alta de M3, guardar y desplegar) y acciones sobre el contenedor.
 * Se registra como filtro global.
 */
@Catch(RechazoOrquestacion)
export class RechazosOrquestacionFilter implements ExceptionFilter {
  catch(error: RechazoOrquestacion, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(HttpStatus.CONFLICT)
      .json({ codigo: error.codigo, mensaje: error.message });
  }
}
