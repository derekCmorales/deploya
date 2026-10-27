import { Catch, Controller, Get, Param, Query, UseFilters, UseGuards, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { ProyectoNoEncontrado } from "../../construccion/dominio/errores";
import { SesionGuard } from "../../identidad/sesion.guard";
import { UsuarioActual } from "../../identidad/usuario-actual.decorator";
import { BitacoraEjecucionService } from "./bitacora-ejecucion.service";
import type { RespuestaBitacora } from "./dominio/bitacora-ejecucion";
import { BitacoraNoDisponible, DesdeBitacoraInvalido } from "./errores";

const ESTADO_POR_ERROR = new Map<string, number>([
  [ProyectoNoEncontrado.name, 404],
  [DesdeBitacoraInvalido.name, 400],
  [BitacoraNoDisponible.name, 503],
]);

/** Proyecto ajeno → 404, `desde` inválido → 400, trabajador sin responder → 503. */
@Catch(ProyectoNoEncontrado, DesdeBitacoraInvalido, BitacoraNoDisponible)
export class ErroresBitacoraFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost): void {
    const respuesta = host.switchToHttp().getResponse<Response>();
    respuesta.status(ESTADO_POR_ERROR.get(error.name) ?? 500).json({ codigo: error.name, mensaje: error.message });
  }
}

export function desdeBitacora(valor: string | undefined): Date | null {
  if (valor === undefined || valor === "") return null;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) throw new DesdeBitacoraInvalido(valor);
  return fecha;
}

/** `GET /proyectos/:id/bitacora?desde=` (SP-12): la web consulta cada 3 s con la marca de su última línea. */
@Controller("proyectos/:id")
@UseFilters(ErroresBitacoraFilter)
@UseGuards(SesionGuard)
export class BitacoraProyectoController {
  constructor(private readonly bitacora: BitacoraEjecucionService) {}

  @Get("bitacora")
  leer(
    @Param("id") proyectoId: string,
    @Query("desde") desde: string | undefined,
    @UsuarioActual("id") usuarioId: string,
  ): Promise<RespuestaBitacora> {
    return this.bitacora.leer(proyectoId, usuarioId, desdeBitacora(desde));
  }
}
