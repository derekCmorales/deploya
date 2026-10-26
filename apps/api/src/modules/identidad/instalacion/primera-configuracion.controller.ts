import { Body, Controller, HttpCode, HttpStatus, Inject, Patch, Post, Req, Res, UseFilters, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { ErroresSuscripcionesFilter } from "../../suscripciones/errores-suscripciones.filter";
import { CONFIGURACION_COOKIE, cookieSesion, type ConfiguracionCookie } from "../cookie-sesion";
import { textoDe, textoOpcionalDe } from "../cuerpo-solicitud";
import type { UsuarioSesion } from "../dominio/sesion";
import { ErroresIdentidadFilter } from "../errores-identidad.filter";
import { Roles } from "../roles.decorator";
import { RolGuard } from "../rol.guard";
import { SesionGuard } from "../sesion.guard";
import { UsuarioActual } from "../usuario-actual.decorator";
import { AsistenteDisponibleGuard } from "./asistente-disponible.guard";
import { ErroresInstalacionFilter } from "./errores-instalacion.filter";
import { PrimeraConfiguracionService, type PruebaEntregada } from "./primera-configuracion.service";

/** La IP del cliente: detrás de Traefik la da `trust proxy` (`PROXIES_DE_CONFIANZA` en docker-compose.vps.yml). */
function origenDe(solicitud: Request): string {
  return solicitud.ip ?? "desconocido";
}

/**
 * Pantalla 31 (SP-17), contrato instalacion.md § Primera configuración. Código y administrador
 * van abiertos (con el código); el correo pide sesión de administrador, como `/admin/*`.
 */
@Controller("instalacion")
@UseFilters(ErroresInstalacionFilter, ErroresSuscripcionesFilter, ErroresIdentidadFilter)
export class PrimeraConfiguracionController {
  constructor(
    private readonly asistente: PrimeraConfiguracionService,
    @Inject(CONFIGURACION_COOKIE) private readonly cookie: ConfiguracionCookie,
  ) {}

  @Post("codigo")
  @HttpCode(HttpStatus.NO_CONTENT)
  async validarCodigo(@Body() cuerpo: unknown, @Req() solicitud: Request): Promise<void> {
    // Sin código es un código inválido (401, cuenta para el límite), no un 400 (contrato v1.8).
    await this.asistente.validarCodigo(textoOpcionalDe(cuerpo, "codigo"), origenDe(solicitud));
  }

  /** 201 + `Set-Cookie`: la misma cookie que `POST /identidad/sesion`; el asistente sigue sin pedir el login. */
  @Post("administrador")
  @HttpCode(HttpStatus.CREATED)
  async crearAdministrador(
    @Body() cuerpo: unknown,
    @Req() solicitud: Request,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<{ usuario: UsuarioSesion }> {
    const { token, usuario } = await this.asistente.crearAdministrador(
      {
        codigo: textoOpcionalDe(cuerpo, "codigo"),
        correo: textoDe(cuerpo, "correo"),
        contrasena: textoDe(cuerpo, "contrasena"),
        agenteUsuario: solicitud.headers["user-agent"] ?? null,
      },
      origenDe(solicitud),
    );
    respuesta.setHeader("Set-Cookie", cookieSesion(token, this.cookie));
    return { usuario };
  }

  @Post("correo/prueba")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AsistenteDisponibleGuard, SesionGuard, RolGuard)
  @Roles("administrador")
  probarCorreo(@Body() cuerpo: unknown, @UsuarioActual("correo") correo: string): Promise<PruebaEntregada> {
    return this.asistente.probarCorreo(cuerpo, correo);
  }

  @Patch("correo")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AsistenteDisponibleGuard, SesionGuard, RolGuard)
  @Roles("administrador")
  async guardarCorreo(@Body() cuerpo: unknown): Promise<void> {
    await this.asistente.guardarCorreo(cuerpo);
  }
}
