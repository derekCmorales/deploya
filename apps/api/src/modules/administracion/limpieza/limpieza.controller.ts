import { Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { RolGuard } from "../../identidad/rol.guard";
import { Roles } from "../../identidad/roles.decorator";
import { SesionGuard } from "../../identidad/sesion.guard";
import { LimpiezaService, type ResultadoLimpieza } from "./limpieza.service";

/** `POST /admin/limpieza/ejecutar`: corre la limpieza diaria a demanda (demo), como el ciclo. Solo administración. */
@Controller("admin/limpieza")
@UseGuards(SesionGuard, RolGuard)
@Roles("administrador")
export class LimpiezaController {
  constructor(private readonly limpieza: LimpiezaService) {}

  @Post("ejecutar")
  @HttpCode(HttpStatus.OK)
  ejecutar(): Promise<ResultadoLimpieza> {
    return this.limpieza.ejecutar();
  }
}
