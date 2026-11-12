import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseFilters, UseGuards } from "@nestjs/common";
import { SesionGuard } from "../identidad/sesion.guard";
import { UsuarioActual } from "../identidad/usuario-actual.decorator";
import { DatosService, type ConexionRecursoDatos, type ListaRecursosDatos } from "./datos.service";
import { confirmacionSolicitada, destinoSolicitado, tipoSolicitado } from "./dominio/solicitudes";
import type { VistaRecursoDatos } from "./dominio/vista-recurso";
import { ErroresDatosFilter } from "./errores-datos.filter";

const RECURSO = "proyectos/:id/datos/:recursoId";

/**
 * Borde HTTP de los recursos de datos (recursos-datos.md). Adapta y delega: el usuario sale de la
 * sesión; un proyecto ajeno responde 404 igual que uno inexistente.
 */
@Controller()
@UseFilters(ErroresDatosFilter)
export class DatosController {
  constructor(private readonly datos: DatosService) {}

  @Get("datos/health")
  health() {
    return { status: "ok", module: "datos" };
  }

  @Get("proyectos/:id/datos")
  @UseGuards(SesionGuard)
  listar(@UsuarioActual("id") usuarioId: string, @Param("id") proyectoId: string): Promise<ListaRecursosDatos> {
    return this.datos.listar(usuarioId, proyectoId);
  }

  @Post("proyectos/:id/datos")
  @UseGuards(SesionGuard)
  crear(@UsuarioActual("id") usuarioId: string, @Param("id") proyectoId: string, @Body() cuerpo: unknown): Promise<VistaRecursoDatos> {
    return this.datos.crear(usuarioId, proyectoId, tipoSolicitado(cuerpo));
  }

  @Get(`${RECURSO}/conexion`)
  @UseGuards(SesionGuard)
  conexion(
    @UsuarioActual("id") usuarioId: string,
    @Param("id") proyectoId: string,
    @Param("recursoId") recursoId: string,
  ): Promise<ConexionRecursoDatos> {
    return this.datos.conexion(usuarioId, proyectoId, recursoId);
  }

  @Post(`${RECURSO}/compartir`)
  @UseGuards(SesionGuard)
  @HttpCode(HttpStatus.OK)
  compartir(
    @UsuarioActual("id") usuarioId: string,
    @Param("id") proyectoId: string,
    @Param("recursoId") recursoId: string,
    @Body() cuerpo: unknown,
  ): Promise<VistaRecursoDatos> {
    return this.datos.compartir(usuarioId, proyectoId, recursoId, destinoSolicitado(cuerpo));
  }

  @Delete(`${RECURSO}/compartir/:destinoId`)
  @UseGuards(SesionGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  dejarDeCompartir(
    @UsuarioActual("id") usuarioId: string,
    @Param("id") proyectoId: string,
    @Param("recursoId") recursoId: string,
    @Param("destinoId") destinoId: string,
  ): Promise<void> {
    return this.datos.dejarDeCompartir(usuarioId, proyectoId, recursoId, destinoId);
  }

  @Delete(RECURSO)
  @UseGuards(SesionGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(
    @UsuarioActual("id") usuarioId: string,
    @Param("id") proyectoId: string,
    @Param("recursoId") recursoId: string,
    @Body() cuerpo: unknown,
  ): Promise<void> {
    return this.datos.eliminar(usuarioId, proyectoId, recursoId, confirmacionSolicitada(cuerpo));
  }
}
