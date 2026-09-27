import {
  BadRequestException,
  Catch,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseFilters,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Response } from "express";
import { ConstruccionService } from "./construccion.service";
import { DespliegueNoEncontrado, ProyectoNoEncontrado, TransicionInvalida } from "./dominio/errores";
import type { DespliegueCreado } from "./dominio/despliegue";
import { UsuarioSolicitante } from "./usuario-solicitante.decorator";
import type { PaginaBitacora, VistaDespliegue } from "./vista-despliegue";

/** Traduce los errores de dominio del motor a HTTP en el borde. */
@Catch(DespliegueNoEncontrado, ProyectoNoEncontrado, TransicionInvalida)
export class ErroresMotorFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost): void {
    const respuesta = host.switchToHttp().getResponse<Response>();
    const estado = error instanceof TransicionInvalida ? 409 : 404;
    respuesta.status(estado).json({ codigo: error.name, mensaje: error.message });
  }
}

@Controller()
@UseFilters(ErroresMotorFilter)
export class DesplieguesController {
  constructor(private readonly construccion: ConstruccionService) {}

  @Post("proyectos/:id/despliegues")
  desplegar(@Param("id") proyectoId: string, @UsuarioSolicitante() usuarioId: string): Promise<DespliegueCreado> {
    return this.construccion.desplegarComoDueno(proyectoId, usuarioId);
  }

  @Get("despliegues/:id")
  consultar(@Param("id") despliegueId: string, @UsuarioSolicitante() usuarioId: string): Promise<VistaDespliegue> {
    return this.construccion.consultar(despliegueId, usuarioId);
  }

  @Get("despliegues/:id/bitacora")
  bitacora(
    @Param("id") despliegueId: string,
    @Query("desde") desde: string | undefined,
    @UsuarioSolicitante() usuarioId: string,
  ): Promise<PaginaBitacora> {
    return this.construccion.bitacoraDesde(despliegueId, usuarioId, posicionDesde(desde));
  }
}

export function posicionDesde(valor: string | undefined): number {
  if (valor === undefined || valor === "") return 0;
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 0) throw new BadRequestException("desde debe ser un entero mayor o igual a 0");
  return n;
}

