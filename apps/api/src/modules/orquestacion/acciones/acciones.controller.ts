import { Controller, HttpCode, HttpStatus, Param, Post, UseFilters, UseGuards } from "@nestjs/common";
import { ErroresMotorFilter } from "../../construccion/despliegues.controller";
import { SesionGuard } from "../../identidad/sesion.guard";
import { UsuarioActual } from "../../identidad/usuario-actual.decorator";
import { AccionesProyectoService } from "./acciones-proyecto.service";

/** Contrato v2.1: 202 `{}` porque la API encola y no espera a Docker; proyecto ajeno → 404. */
@Controller("proyectos/:id")
@UseFilters(ErroresMotorFilter)
@UseGuards(SesionGuard)
export class AccionesController {
  constructor(private readonly acciones: AccionesProyectoService) {}

  @Post("reiniciar")
  @HttpCode(HttpStatus.ACCEPTED)
  async reiniciar(@Param("id") proyectoId: string, @UsuarioActual("id") usuarioId: string): Promise<Record<string, never>> {
    await this.acciones.reiniciar(proyectoId, usuarioId);
    return {};
  }

  @Post("detener")
  @HttpCode(HttpStatus.ACCEPTED)
  async detener(@Param("id") proyectoId: string, @UsuarioActual("id") usuarioId: string): Promise<Record<string, never>> {
    await this.acciones.detener(proyectoId, usuarioId);
    return {};
  }
}
