import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Post, Req, Res, UseFilters, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { COOKIE_SESION, cookieSesion, cookieSesionVencida, leerCookie, type ConfiguracionCookie } from "./cookie-sesion";
import type { UsuarioSesion } from "./dominio/sesion";
import { ErroresIdentidadFilter, textoDe } from "./identidad.controller";
import { SesionGuard } from "./sesion.guard";
import { SesionService } from "./sesion.service";
import { UsuarioActual } from "./usuario-actual.decorator";

export const CONFIGURACION_COOKIE = Symbol("CONFIGURACION_COOKIE");

/** Pantalla 03 (M1-03). El token viaja solo en la cookie HttpOnly; el JSON lleva el usuario. */
@Controller("identidad/sesion")
@UseFilters(ErroresIdentidadFilter)
export class SesionController {
  constructor(
    private readonly sesiones: SesionService,
    @Inject(CONFIGURACION_COOKIE) private readonly cookie: ConfiguracionCookie,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async iniciar(
    @Body() cuerpo: unknown,
    @Req() solicitud: Request,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<{ usuario: UsuarioSesion }> {
    const { token, usuario } = await this.sesiones.iniciar({
      correo: textoDe(cuerpo, "correo"),
      contrasena: textoDe(cuerpo, "contrasena"),
      agenteUsuario: solicitud.headers["user-agent"] ?? null,
    });
    respuesta.setHeader("Set-Cookie", cookieSesion(token, this.cookie));
    return { usuario };
  }

  /** Quién soy: la web lo usa para el header y para saber si hay sesión. */
  @Get()
  @UseGuards(SesionGuard)
  actual(@UsuarioActual() usuario: UsuarioSesion): { usuario: UsuarioSesion } {
    return { usuario };
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async cerrar(@Req() solicitud: Request, @Res({ passthrough: true }) respuesta: Response): Promise<void> {
    const token = leerCookie(solicitud.headers.cookie, COOKIE_SESION);
    if (token) await this.sesiones.cerrar(token);
    respuesta.setHeader("Set-Cookie", cookieSesionVencida(this.cookie));
  }
}
