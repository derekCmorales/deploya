import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Param, Post, UseFilters, UseGuards } from "@nestjs/common";
import { SesionGuard } from "../../identidad/sesion.guard";
import { UsuarioActual } from "../../identidad/usuario-actual.decorator";
import { ErroresMotorFilter } from "../despliegues.controller";
import type { DespliegueCreado } from "../dominio/despliegue";
import { AccionesDespliegueService } from "./acciones-despliegue.service";

interface CuerpoRedespliegue {
  commitSha?: unknown;
}

/** Contrato v3 (M4-02): cancelar → 200, reintentar y redesplegar → 201; los rechazos salen como 409 con `codigo`. */
@Controller()
@UseFilters(ErroresMotorFilter)
@UseGuards(SesionGuard)
export class AccionesDespliegueController {
  constructor(private readonly acciones: AccionesDespliegueService) {}

  @Post("despliegues/:id/cancelar")
  @HttpCode(HttpStatus.OK)
  cancelar(@Param("id") despliegueId: string, @UsuarioActual("id") usuarioId: string): Promise<{ estado: "cancelado" }> {
    return this.acciones.cancelar(despliegueId, usuarioId);
  }

  @Post("despliegues/:id/reintentar")
  reintentar(@Param("id") despliegueId: string, @UsuarioActual("id") usuarioId: string): Promise<DespliegueCreado> {
    return this.acciones.reintentar(despliegueId, usuarioId);
  }

  @Post("proyectos/:id/redespliegues")
  redesplegar(
    @Param("id") proyectoId: string,
    @Body() cuerpo: CuerpoRedespliegue,
    @UsuarioActual("id") usuarioId: string,
  ): Promise<DespliegueCreado> {
    if (typeof cuerpo?.commitSha !== "string" || cuerpo.commitSha === "") throw new BadRequestException("commitSha es obligatorio");
    return this.acciones.redesplegar(proyectoId, cuerpo.commitSha, usuarioId);
  }
}
