import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseFilters, UseGuards } from "@nestjs/common";
import { SesionGuard } from "../identidad/sesion.guard";
import { UsuarioActual } from "../identidad/usuario-actual.decorator";
import { ContratacionService, type ResultadoContratacion } from "./contratacion.service";
import type { Cotizacion, VistaSuscripcion } from "./dominio/mi-suscripcion";
import { validarSolicitudContratacion, validarSolicitudCotizacion, validarSolicitudDescenso } from "./dominio/tarjeta";
import { ErroresSuscripcionesFilter } from "./errores-suscripciones.filter";

/**
 * Borde HTTP de la suscripción del cliente (07, 07b, 08). Todo con sesión: el usuario sale
 * de `SesionGuard` + `@UsuarioActual()`, nunca del cuerpo. Un pago rechazado responde 200
 * con `resultado: "rechazado"`: es un resultado del negocio, no un error.
 */
@Controller("suscripciones")
@UseGuards(SesionGuard)
@UseFilters(ErroresSuscripcionesFilter)
export class CobroController {
  constructor(private readonly contratacion: ContratacionService) {}

  @Get("mia")
  mia(@UsuarioActual("id") usuarioId: string): Promise<VistaSuscripcion> {
    return this.contratacion.miSuscripcion(usuarioId);
  }

  @Get("cotizacion")
  cotizacion(@UsuarioActual("id") usuarioId: string, @Query() consulta: unknown): Promise<Cotizacion> {
    return this.contratacion.cotizar(usuarioId, validarSolicitudCotizacion(consulta));
  }

  @Post("contratar")
  @HttpCode(HttpStatus.OK)
  contratar(@UsuarioActual("id") usuarioId: string, @Body() cuerpo: unknown): Promise<ResultadoContratacion> {
    return this.contratacion.contratar(usuarioId, validarSolicitudContratacion(cuerpo));
  }

  @Post("descenso")
  @HttpCode(HttpStatus.OK)
  descenso(@UsuarioActual("id") usuarioId: string, @Body() cuerpo: unknown): Promise<VistaSuscripcion> {
    return this.contratacion.programarDescenso(usuarioId, validarSolicitudDescenso(cuerpo).plan);
  }
}
