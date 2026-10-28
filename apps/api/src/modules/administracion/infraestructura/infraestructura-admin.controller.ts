import { Controller, Get, UseGuards } from "@nestjs/common";
import { RolGuard } from "../../identidad/rol.guard";
import { Roles } from "../../identidad/roles.decorator";
import { SesionGuard } from "../../identidad/sesion.guard";
import type { VistaInfraestructura } from "./dominio/infraestructura";
import { InfraestructuraService } from "./infraestructura.service";

/** Pantalla 27 (SP-13): solo lectura y solo Administrador, en la nube y en autoalojado. */
@Controller("admin/infraestructura")
@UseGuards(SesionGuard, RolGuard)
@Roles("administrador")
export class InfraestructuraAdminController {
  constructor(private readonly infraestructura: InfraestructuraService) {}

  @Get()
  leer(): Promise<VistaInfraestructura> {
    return this.infraestructura.leer();
  }
}
