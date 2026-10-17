import { BadRequestException, Body, Controller, Get, Param, Post, UseFilters, UseGuards } from "@nestjs/common";
import { ErroresMotorFilter } from "../../construccion/despliegues.controller";
import type { DespliegueCreado } from "../../construccion/dominio/despliegue";
import { SesionGuard } from "../../identidad/sesion.guard";
import { UsuarioActual } from "../../identidad/usuario-actual.decorator";
import { ReversionService, type VistaArtefacto } from "./reversion.service";

interface CuerpoReversion {
  artefactoId?: unknown;
}

/** Contrato v2 (M5-04): 201 al crear la reversión, 409 con `codigo` si no procede; proyecto ajeno → 404. */
@Controller("proyectos/:id")
@UseFilters(ErroresMotorFilter)
@UseGuards(SesionGuard)
export class ReversionController {
  constructor(private readonly reversion: ReversionService) {}

  @Post("reversiones")
  revertir(
    @Param("id") proyectoId: string,
    @Body() cuerpo: CuerpoReversion,
    @UsuarioActual("id") usuarioId: string,
  ): Promise<DespliegueCreado> {
    if (typeof cuerpo?.artefactoId !== "string" || cuerpo.artefactoId === "") {
      throw new BadRequestException("artefactoId es obligatorio");
    }
    return this.reversion.revertir(proyectoId, cuerpo.artefactoId, usuarioId);
  }

  @Get("artefactos")
  artefactos(@Param("id") proyectoId: string, @UsuarioActual("id") usuarioId: string): Promise<VistaArtefacto[]> {
    return this.reversion.artefactosDe(proyectoId, usuarioId);
  }
}
