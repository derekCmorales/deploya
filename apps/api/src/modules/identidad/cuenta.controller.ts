import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Patch, Post, Req, Res, UseFilters, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { COOKIE_SESION, cookieSesionVencida, leerCookie, type ConfiguracionCookie } from "./cookie-sesion";
import { CuentaService, type PerfilCuenta } from "./cuenta.service";
import { ErroresIdentidadFilter, textoDe } from "./identidad.controller";
import { CONFIGURACION_COOKIE } from "./sesion.controller";
import { SesionGuard } from "./sesion.guard";
import { UsuarioActual } from "./usuario-actual.decorator";

/** El cuerpo del PATCH lleva el nombre tal cual; recortarlo y validarlo es del dominio. */
function nombreDe(cuerpo: unknown): string {
  const valor = typeof cuerpo === "object" && cuerpo !== null ? (cuerpo as Record<string, unknown>).nombre : undefined;
  return typeof valor === "string" ? valor : "";
}

/** Pantallas 05 y 05b (M1-06, M1-07). Todas las rutas exigen sesión. */
@Controller("identidad")
@UseGuards(SesionGuard)
@UseFilters(ErroresIdentidadFilter)
export class CuentaController {
  constructor(
    private readonly cuenta: CuentaService,
    @Inject(CONFIGURACION_COOKIE) private readonly cookie: ConfiguracionCookie,
  ) {}

  @Get("cuenta")
  perfil(@UsuarioActual("id") usuarioId: string): Promise<PerfilCuenta> {
    return this.cuenta.perfil(usuarioId);
  }

  /** Un nombre vacío llega como `NombreInvalido` (400), igual que uno de 65 caracteres. */
  @Patch("cuenta")
  renombrar(@UsuarioActual("id") usuarioId: string, @Body() cuerpo: unknown): Promise<PerfilCuenta> {
    return this.cuenta.renombrar(usuarioId, nombreDe(cuerpo));
  }

  /** La sesión de la cookie es la que sigue viva; las demás se revocan. */
  @Post("cuenta/contrasena")
  @HttpCode(HttpStatus.NO_CONTENT)
  async cambiarContrasena(@UsuarioActual("id") usuarioId: string, @Body() cuerpo: unknown, @Req() solicitud: Request): Promise<void> {
    const token = leerCookie(solicitud.headers.cookie, COOKIE_SESION) ?? "";
    await this.cuenta.cambiarContrasena(usuarioId, token, { actual: textoDe(cuerpo, "actual"), nueva: textoDe(cuerpo, "nueva") });
  }

  /** «Cerrar todas»: revoca todas las sesiones, incluida esta, y vence la cookie aquí mismo. */
  @Delete("sesiones")
  @HttpCode(HttpStatus.NO_CONTENT)
  async cerrarTodas(@UsuarioActual("id") usuarioId: string, @Res({ passthrough: true }) respuesta: Response): Promise<void> {
    await this.cuenta.cerrarTodas(usuarioId);
    respuesta.setHeader("Set-Cookie", cookieSesionVencida(this.cookie));
  }
}
