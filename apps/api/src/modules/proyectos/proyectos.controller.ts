<<<<<<< HEAD
import { Controller, Get, Post, Body, UseFilters } from "@nestjs/common";
import { ProyectosService } from "./proyectos.service";
import { ErroresProyectosFilter } from "./errores-proyectos.filter";
import { UsuarioSolicitante } from "../construccion/usuario-solicitante.decorator";
=======
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseFilters, UseGuards } from "@nestjs/common";
import { SesionGuard } from "../identidad/sesion.guard";
import { UsuarioActual } from "../identidad/usuario-actual.decorator";
import { validarAltaProyecto, validarConfirmacionEliminar, validarConsultaRepositorio } from "./dominio/alta-proyecto";
import type { ValidacionRepositorio } from "./dominio/proyecto";
import { ErroresProyectosFilter } from "./errores-proyectos.filter";
import { ProyectosService, type ListaProyectos, type ProyectoCreado } from "./proyectos.service";
>>>>>>> origin/main

/** Borde HTTP de M3. El usuario sale de la sesión (`SesionGuard` + `@UsuarioActual()`), nunca del cuerpo. */
@Controller("proyectos")
@UseFilters(ErroresProyectosFilter)
export class ProyectosController {
<<<<<<< HEAD
  constructor(private readonly proyectosService: ProyectosService) {}
=======
  constructor(private readonly proyectos: ProyectosService) {}
>>>>>>> origin/main

  @Get("health")
  health() {
    return { status: "ok", module: "proyectos" };
  }

  @Get()
<<<<<<< HEAD
  async listar(@UsuarioSolicitante() usuario: { id: string }) {
    return this.proyectosService.listar(usuario.id);
  }

  @Post("validar-repositorio")
  async validarRepositorio(@Body() body: { url: string; rama?: string }) {
    return this.proyectosService.validarRepositorio(body.url, body.rama);
  }

  @Post()
  async crear(
    @UsuarioSolicitante() usuario: { id: string },
    @Body() body: unknown
  ) {
    return this.proyectosService.crear(usuario.id, body);
  }
}
=======
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

  @Delete(":id")
  @UseGuards(SesionGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@UsuarioActual("id") usuarioId: string, @Param("id") id: string, @Body() cuerpo: unknown): Promise<void> {
    return this.proyectos.eliminar(usuarioId, id, validarConfirmacionEliminar(cuerpo));
  }
}
>>>>>>> origin/main
