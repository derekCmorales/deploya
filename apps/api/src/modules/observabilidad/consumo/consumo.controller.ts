import { Controller, Get, UseFilters, UseGuards } from "@nestjs/common";
import { ErroresMotorFilter } from "../../construccion/despliegues.controller";
import { SesionGuard } from "../../identidad/sesion.guard";
import { UsuarioActual } from "../../identidad/usuario-actual.decorator";
import { ConsumoService, type ConsumoPeriodoDto } from "./consumo.service";

@Controller("observabilidad")
@UseFilters(ErroresMotorFilter) 
@UseGuards(SesionGuard)
export class ConsumoController {
  constructor(private readonly consumoService: ConsumoService) {}

  @Get("consumo")
  consumoDe(@UsuarioActual("id") usuarioId: string): Promise<ConsumoPeriodoDto> {
    return this.consumoService.de(usuarioId);
  }
}