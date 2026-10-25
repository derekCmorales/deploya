import { Controller, Get, Param, Query, UseFilters, UseGuards } from "@nestjs/common";
import { SesionGuard } from "../../identidad/sesion.guard";
import { UsuarioActual } from "../../identidad/usuario-actual.decorator";
import { ErroresMetricasFilter } from "../metricas/metricas-proyecto.controller";
import { TiemposService, ultimosDe, type RespuestaTiempos } from "./tiempos.service";

/**
 * `GET /proyectos/:id/despliegues/tiempos?ultimos=14`. Proyecto ajeno → 404.
 * `TiemposModule` se registra en `AppModule` antes de `ProyectosModule`, así que «tiempos»
 * no cae en `/despliegues/:numero` de M4.
 */
@Controller("proyectos/:id/despliegues")
@UseFilters(ErroresMetricasFilter)
@UseGuards(SesionGuard)
export class TiemposController {
  constructor(private readonly tiempos: TiemposService) {}

  @Get("tiempos")
  tiemposDe(
    @Param("id") proyectoId: string,
    @Query("ultimos") ultimos: string | undefined,
    @UsuarioActual("id") usuarioId: string,
  ): Promise<RespuestaTiempos> {
    return this.tiempos.leer(proyectoId, usuarioId, ultimosDe(ultimos));
  }
}
