import { Catch, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import {
  ContrasenaActualIncorrecta,
  ContrasenaDebil,
  ContrasenaRepetida,
  ContrasenasNoCoinciden,
  CorreoInvalido,
  CorreoYaRegistrado,
  CredencialesInvalidas,
  CuentaInexistente,
  CuentaNoVerificada,
  CuentaSuspendida,
  EsperaReenvio,
  NombreInvalido,
  TokenNoValido,
} from "./dominio/errores";

const HTTP_SOLICITUD_INVALIDA = 400;
const HTTP_NO_AUTENTICADO = 401;
const HTTP_PROHIBIDO = 403;
const HTTP_CONFLICTO = 409;
const HTTP_YA_NO_EXISTE = 410;
const HTTP_DEMASIADAS_SOLICITUDES = 429;

/** Traduce los errores de dominio de M1 a HTTP en el borde; `codigo` es lo que lee la web. */
@Catch(
  CorreoInvalido,
  ContrasenaDebil,
  ContrasenasNoCoinciden,
  CorreoYaRegistrado,
  TokenNoValido,
  CredencialesInvalidas,
  CuentaNoVerificada,
  CuentaSuspendida,
  EsperaReenvio,
  NombreInvalido,
  ContrasenaActualIncorrecta,
  CuentaInexistente,
  ContrasenaRepetida,
)
export class ErroresIdentidadFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost): void {
    const respuesta = host.switchToHttp().getResponse<Response>();
    const cuerpo = { codigo: error.name, mensaje: error.message };
    if (error instanceof CuentaInexistente) {
      respuesta.status(HTTP_NO_AUTENTICADO).json({ codigo: "SinSesion", mensaje: error.message });
      return;
    }
    if (error instanceof CredencialesInvalidas) {
      respuesta.status(HTTP_NO_AUTENTICADO).json(cuerpo);
      return;
    }
    if (error instanceof CuentaNoVerificada) {
      respuesta.status(HTTP_PROHIBIDO).json({ ...cuerpo, correoEnmascarado: error.correoEnmascarado });
      return;
    }
    if (error instanceof CuentaSuspendida) {
      respuesta.status(HTTP_PROHIBIDO).json({ ...cuerpo, motivo: error.motivo, desde: error.desde?.toISOString() ?? null });
      return;
    }
    if (error instanceof CorreoYaRegistrado) {
      respuesta.status(HTTP_CONFLICTO).json(cuerpo);
      return;
    }
    if (error instanceof EsperaReenvio) {
      respuesta.status(HTTP_DEMASIADAS_SOLICITUDES).json({ ...cuerpo, segundos: error.segundos });
      return;
    }
    if (error instanceof TokenNoValido) {
      respuesta.status(HTTP_YA_NO_EXISTE).json(cuerpo);
      return;
    }
    const reglasIncumplidas = error instanceof ContrasenaDebil ? error.reglasIncumplidas : undefined;
    respuesta.status(HTTP_SOLICITUD_INVALIDA).json({ ...cuerpo, reglasIncumplidas });
  }
}
