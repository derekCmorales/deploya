import { Controller, Get, Param, UseFilters, UseGuards } from "@nestjs/common";
import { ErroresMotorFilter } from "../../construccion/despliegues.controller";
import { SesionGuard } from "../../identidad/sesion.guard";
import { UsuarioActual } from "../../identidad/usuario-actual.decorator";
import { ResumenProyectoService, type ResumenProyecto } from "./resumen-proyecto.service";

/** `GET /proyectos/:id/resumen`: proyecto ajeno o inexistente → 404. */
@Controller("proyectos/:id")
@UseFilters(ErroresMotorFilter)
@UseGuards(SesionGuard)
export class ResumenProyectoController {
  constructor(private readonly resumen: ResumenProyectoService) {}

  @Get("resumen")
  resumenDe(@Param("id") proyectoId: string, @UsuarioActual("id") usuarioId: string): Promise<ResumenProyecto> {
    return this.resumen.resumen(proyectoId, usuarioId);
  }
}
