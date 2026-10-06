import {
  BadRequestException,
  Catch,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseFilters,
  UseGuards,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Response } from "express";
import { SesionGuard } from "../identidad/sesion.guard";
import { UsuarioActual } from "../identidad/usuario-actual.decorator";
import { ConstruccionService } from "./construccion.service";
import { DespliegueNoEncontrado, ProyectoNoEncontrado, TransicionInvalida } from "./dominio/errores";
import type { DespliegueCreado } from "./dominio/despliegue";
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

/** Rutas del contrato de despliegues: todas exigen sesión (M1-03). */
@Controller()
@UseFilters(ErroresMotorFilter)
@UseGuards(SesionGuard)
export class DesplieguesController {
  constructor(private readonly construccion: ConstruccionService) {}

  @Post("proyectos/:id/despliegues")
  desplegar(@Param("id") proyectoId: string, @UsuarioActual("id") usuarioId: string): Promise<DespliegueCreado> {
    return this.construccion.desplegarComoDueno(proyectoId, usuarioId);
  }

  @Get("proyectos/:id/despliegues/:numero")
  consultarPorNumero(
    @Param("id") proyectoId: string,
    @Param("numero") numero: string,
    @UsuarioActual("id") usuarioId: string,
  ): Promise<VistaDespliegue> {
    return this.construccion.consultarPorNumero(proyectoId, numeroDespliegue(numero), usuarioId);
  }

  @Get("despliegues/:id")
  consultar(@Param("id") despliegueId: string, @UsuarioActual("id") usuarioId: string): Promise<VistaDespliegue> {
    return this.construccion.consultar(despliegueId, usuarioId);
  }

  @Get("despliegues/:id/bitacora")
  bitacora(
    @Param("id") despliegueId: string,
    @Query("desde") desde: string | undefined,
    @UsuarioActual("id") usuarioId: string,
  ): Promise<PaginaBitacora> {
    return this.construccion.bitacoraDesde(despliegueId, usuarioId, posicionDesde(desde));
  }
}

/** Un número que no es entero positivo no puede existir: se responde como inexistente. */
export function numeroDespliegue(valor: string): number {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 1) throw new DespliegueNoEncontrado(`#${valor}`);
  return n;
}

export function posicionDesde(valor: string | undefined): number {
  if (valor === undefined || valor === "") return 0;
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 0) throw new BadRequestException("desde debe ser un entero mayor o igual a 0");
  return n;
}

