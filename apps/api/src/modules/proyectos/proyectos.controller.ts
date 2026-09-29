import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseFilters, UseGuards } from "@nestjs/common";
import { SesionGuard } from "../identidad/sesion.guard";
import { UsuarioActual } from "../identidad/usuario-actual.decorator";
import { validarAltaProyecto, validarConsultaRepositorio } from "./dominio/alta-proyecto";
import type { ValidacionRepositorio } from "./dominio/proyecto";
import { ErroresProyectosFilter } from "./errores-proyectos.filter";
import { ProyectosService, type ListaProyectos, type ProyectoCreado } from "./proyectos.service";

/** Borde HTTP de M3. El usuario sale de la sesión (`SesionGuard` + `@UsuarioActual()`), nunca del cuerpo. */
@Controller("proyectos")
@UseFilters(ErroresProyectosFilter)
export class ProyectosController {
  constructor(private readonly proyectos: ProyectosService) {}

  @Get("health")
  health() {
    return { status: "ok", module: "proyectos" };
  }

  @Get()
  @UseGuards(SesionGuard)
  listar(@UsuarioActual("id") usuarioId: string): Promise<ListaProyectos> {
    return this.proyectos.listar(usuarioId);
  }

  @Post("validar-repositorio")
  @UseGuards(SesionGuard)
  @HttpCode(HttpStatus.OK)
  validarRepositorio(@Body() cuerpo: unknown): Promise<ValidacionRepositorio> {
    return this.proyectos.validarRepositorio(validarConsultaRepositorio(cuerpo));
  }

  @Post()
  @UseGuards(SesionGuard)
  crear(@UsuarioActual("id") usuarioId: string, @Body() cuerpo: unknown): Promise<ProyectoCreado> {
    return this.proyectos.crear(usuarioId, validarAltaProyecto(cuerpo));
  }
}
