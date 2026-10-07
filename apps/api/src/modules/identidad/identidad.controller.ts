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
  CredencialesInvalidas,
  CuentaNoVerificada,
  CuentaSuspendida,
  EsperaReenvio,
  TokenNoValido,
} from "./dominio/errores";
import { ESPERA_REENVIO_MS } from "./dominio/politica-reenvio";
import { IdentidadService, type CuentaRegistrada, type CuentaVerificada, type SolicitudReenvio } from "./identidad.service";

const HTTP_CREADO = 201;
const HTTP_OK = 200;
const HTTP_SOLICITUD_INVALIDA = 400;
const HTTP_NO_AUTENTICADO = 401;
const HTTP_PROHIBIDO = 403;
const HTTP_CONFLICTO = 409;
const HTTP_YA_NO_EXISTE = 410;
const HTTP_ACEPTADO = 202;
const HTTP_DEMASIADAS_SOLICITUDES = 429;
const MS_POR_SEGUNDO = 1000;

/**
 * Pantallas 02 y 03b: el mismo cuerpo para toda solicitud aceptada, exista o no la cuenta.
 * `segundos` es la cuenta atrás con la que arranca la web (no la inventa el cliente).
 */
export const REENVIO_ACEPTADO = {
  mensaje: "Si la cuenta está pendiente, te enviamos un enlace nuevo.",
  segundos: ESPERA_REENVIO_MS / MS_POR_SEGUNDO,
} as const;

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
)
export class ErroresIdentidadFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost): void {
    const respuesta = host.switchToHttp().getResponse<Response>();
    const cuerpo = { codigo: error.name, mensaje: error.message };
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

  /** Pantallas 02 y 03b (M1-04): 202 neutro, o 429 `EsperaReenvio` con los segundos que faltan. */
  @Post("verificacion/reenvio")
  @HttpCode(HTTP_ACEPTADO)
  async reenviar(@Body() cuerpo: unknown): Promise<typeof REENVIO_ACEPTADO> {
    await this.identidad.reenviarVerificacion(solicitudDeReenvio(cuerpo));
    return REENVIO_ACEPTADO;
  }
}

/** El cuerpo trae `correo` (03b) o el `token` del enlace vencido (02 c); sin ninguno, 400. */
function solicitudDeReenvio(cuerpo: unknown): SolicitudReenvio {
  const campos = typeof cuerpo === "object" && cuerpo !== null ? (cuerpo as Record<string, unknown>) : {};
  if (typeof campos.token === "string" && campos.token !== "") return { token: campos.token };
  return { correo: textoDe(cuerpo, "correo") };
}
