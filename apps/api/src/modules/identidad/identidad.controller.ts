import {
  BadRequestException,
  Body,
  Catch,
  Controller,
  Get,
  HttpCode,
  Post,
  UseFilters,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Response } from "express";
import {
  ContrasenaDebil,
  ContrasenasNoCoinciden,
  CorreoInvalido,
  CorreoYaRegistrado,
  TokenNoValido,
} from "./dominio/errores";
import { IdentidadService, type CuentaRegistrada, type CuentaVerificada } from "./identidad.service";

const HTTP_CREADO = 201;
const HTTP_OK = 200;
const HTTP_SOLICITUD_INVALIDA = 400;
const HTTP_CONFLICTO = 409;
const HTTP_YA_NO_EXISTE = 410;

/** Traduce los errores de dominio de M1 a HTTP en el borde; `codigo` es lo que lee la web. */
@Catch(CorreoInvalido, ContrasenaDebil, ContrasenasNoCoinciden, CorreoYaRegistrado, TokenNoValido)
export class ErroresIdentidadFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost): void {
    const respuesta = host.switchToHttp().getResponse<Response>();
    const cuerpo = { codigo: error.name, mensaje: error.message };
    if (error instanceof CorreoYaRegistrado) {
      respuesta.status(HTTP_CONFLICTO).json(cuerpo);
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

export function textoDe(cuerpo: unknown, campo: string): string {
  const valor = typeof cuerpo === "object" && cuerpo !== null ? (cuerpo as Record<string, unknown>)[campo] : undefined;
  if (typeof valor !== "string" || valor === "") throw new BadRequestException(`Falta el campo «${campo}»`);
  return valor;
}

@Controller("identidad")
@UseFilters(ErroresIdentidadFilter)
export class IdentidadController {
  constructor(private readonly identidad: IdentidadService) {}

  @Get("health")
  health() {
    return { status: "ok", module: "identidad" };
  }

  /** Pantallas 01 y 01b. La web trata solo el 201 como «Cuenta creada». */
  @Post("registro")
  @HttpCode(HTTP_CREADO)
  registrar(@Body() cuerpo: unknown): Promise<CuentaRegistrada> {
    const contrasena = textoDe(cuerpo, "contrasena");
    if (textoDe(cuerpo, "confirmacion") !== contrasena) throw new ContrasenasNoCoinciden();
    return this.identidad.registrar({ correo: textoDe(cuerpo, "correo"), contrasena });
  }

  /** Pantalla 02: POST y no GET, porque consume el token (abrir el enlace no debe tener efectos). */
  @Post("verificacion")
  @HttpCode(HTTP_OK)
  verificar(@Body() cuerpo: unknown): Promise<CuentaVerificada> {
    return this.identidad.verificar(textoDe(cuerpo, "token"));
  }
}
