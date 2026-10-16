import { Controller, Get, Param, UseFilters, UseGuards } from "@nestjs/common";
import { ErroresMotorFilter } from "../../construccion/despliegues.controller";
import { SesionGuard } from "../../identidad/sesion.guard";
import { UsuarioActual } from "../../identidad/usuario-actual.decorator";
import { ActividadService, type ActividadProyectoDto } from "./actividad.service";

@Controller("proyectos")
@UseFilters(ErroresMotorFilter)
@UseGuards(SesionGuard)
export class ActividadController {
  constructor(private readonly actividadService: ActividadService) {}

  @Get(":id/actividad")
  actividadDe(
    @Param("id") proyectoId: string,
    @UsuarioActual("id") usuarioId: string,
  ): Promise<ActividadProyectoDto> {
    return this.actividadService.de(proyectoId, usuarioId);
  }
}