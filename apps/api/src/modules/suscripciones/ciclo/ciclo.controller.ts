import { Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { RolGuard } from "../../identidad/rol.guard";
import { Roles } from "../../identidad/roles.decorator";
import { SesionGuard } from "../../identidad/sesion.guard";
import { CicloSuscripcionService, type ResultadoCiclo } from "./ciclo-suscripcion.service";

/** `POST /admin/ciclo/ejecutar`: corre el ciclo §4.4 a demanda (demo). Solo administración. */
@Controller("admin/ciclo")
@UseGuards(SesionGuard, RolGuard)
@Roles("administrador")
export class CicloController {
  constructor(private readonly ciclo: CicloSuscripcionService) {}

  @Post("ejecutar")
  @HttpCode(HttpStatus.OK)
  ejecutar(): Promise<ResultadoCiclo> {
    return this.ciclo.ejecutar();
  }
}
