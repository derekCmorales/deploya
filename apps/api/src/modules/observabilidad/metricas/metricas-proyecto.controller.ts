import { Catch, Controller, Get, Param, Query, UseFilters, UseGuards, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { ProyectoNoEncontrado } from "../../construccion/dominio/errores";
import { SesionGuard } from "../../identidad/sesion.guard";
import { UsuarioActual } from "../../identidad/usuario-actual.decorator";
import { RangoMetricasInvalido } from "./errores";
import { LecturaMetricasService } from "./lectura-metricas.service";
import type { RangoMetricas, RespuestaMetricas } from "./dominio/serie-metricas";

/** Traduce el dueño inexistente a 404 y un rango que no es 1h|24h a 400. */
@Catch(ProyectoNoEncontrado, RangoMetricasInvalido)
export class ErroresMetricasFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost): void {
    const respuesta = host.switchToHttp().getResponse<Response>();
    const estado = error instanceof RangoMetricasInvalido ? 400 : 404;
    respuesta.status(estado).json({ codigo: error.name, mensaje: error.message });
  }
}

export function rangoMetricas(valor: string | undefined): RangoMetricas {
  if (valor === "1h" || valor === "24h") return valor;
  throw new RangoMetricasInvalido(valor ?? "");
}

/** `GET /proyectos/:id/metricas?rango=1h|24h`. Proyecto ajeno → 404. */
@Controller("proyectos/:id")
@UseFilters(ErroresMetricasFilter)
@UseGuards(SesionGuard)
export class MetricasProyectoController {
  constructor(private readonly lectura: LecturaMetricasService) {}

  @Get("metricas")
  metricas(
    @Param("id") proyectoId: string,
    @Query("rango") rango: string | undefined,
    @UsuarioActual("id") usuarioId: string,
  ): Promise<RespuestaMetricas> {
    return this.lectura.leer(proyectoId, usuarioId, rangoMetricas(rango));
  }
}
