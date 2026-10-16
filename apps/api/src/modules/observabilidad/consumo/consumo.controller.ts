import { Controller, Get, UseGuards } from "@nestjs/common";
import { SesionGuard } from "../../identidad/sesion.guard";
import { UsuarioActual } from "../../identidad/usuario-actual.decorator";
import { ConsumoService, type ConsumoPeriodoDto } from "./consumo.service";

@Controller("observabilidad")
@UseGuards(SesionGuard)
export class ConsumoController {
  constructor(private readonly consumoService: ConsumoService) {}

  @Get("consumo")
  consumoDe(@UsuarioActual("id") usuarioId: string): Promise<ConsumoPeriodoDto> {
    return this.consumoService.de(usuarioId);
  }
}