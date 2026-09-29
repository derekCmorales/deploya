import { Controller, Get, Post, Body, UseFilters } from "@nestjs/common";
import { ProyectosService } from "./proyectos.service";
import { ErroresProyectosFilter } from "./errores-proyectos.filter";
import { UsuarioSolicitante } from "../construccion/usuario-solicitante.decorator";

@Controller("proyectos")
@UseFilters(ErroresProyectosFilter)
export class ProyectosController {
  constructor(private readonly proyectosService: ProyectosService) {}

  @Get("health")
  health() {
    return { status: "ok", module: "proyectos" };
  }

  @Get()
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