import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseFilters } from "@nestjs/common";
import { UsuarioSolicitante } from "../construccion/usuario-solicitante.decorator";
import { validarAltaProyecto, validarConsultaRepositorio } from "./dominio/alta-proyecto";
import type { ValidacionRepositorio } from "./dominio/proyecto";
import { ErroresProyectosFilter } from "./errores-proyectos.filter";
import { ProyectosService, type ListaProyectos, type ProyectoCreado } from "./proyectos.service";

/**
 * Borde HTTP de M3. El usuario sale de la sesión (`@UsuarioSolicitante()` hasta que M1
 * publique `@UsuarioActual()`), nunca del cuerpo.
 */
@Controller("proyectos")
@UseFilters(ErroresProyectosFilter)
export class ProyectosController {
  constructor(private readonly proyectos: ProyectosService) {}

  @Get("health")
  health() {
    return { status: "ok", module: "proyectos" };
  }

  @Get()
  listar(@UsuarioSolicitante() usuarioId: string): Promise<ListaProyectos> {
    return this.proyectos.listar(usuarioId);
  }

  @Post("validar-repositorio")
  @HttpCode(HttpStatus.OK)
  validarRepositorio(@UsuarioSolicitante() _usuarioId: string, @Body() cuerpo: unknown): Promise<ValidacionRepositorio> {
    return this.proyectos.validarRepositorio(validarConsultaRepositorio(cuerpo));
  }

  @Post()
  crear(@UsuarioSolicitante() usuarioId: string, @Body() cuerpo: unknown): Promise<ProyectoCreado> {
    return this.proyectos.crear(usuarioId, validarAltaProyecto(cuerpo));
  }
}
