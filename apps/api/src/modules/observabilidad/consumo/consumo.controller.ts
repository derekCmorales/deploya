import { Controller, Get, UseFilters, UseGuards } from "@nestjs/common";
import { ErroresSuscripcionesFilter } from "../../suscripciones/errores-suscripciones.filter";
import { SesionGuard } from "../../identidad/sesion.guard";
import { UsuarioActual } from "../../identidad/usuario-actual.decorator";
import { ConsumoService, type ConsumoPeriodoDto } from "./consumo.service";

/** Consumo del período (pantalla 08); sin suscripción responde 404 `sin-suscripcion`, no 500. */
@Controller("observabilidad")
@UseFilters(ErroresSuscripcionesFilter)
@UseGuards(SesionGuard)
export class ConsumoController {
  constructor(private readonly consumoService: ConsumoService) {}

  @Get("consumo")
  consumoDe(@UsuarioActual("id") usuarioId: string): Promise<ConsumoPeriodoDto> {
    return this.consumoService.de(usuarioId);
  }
}
