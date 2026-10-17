import { Controller, Get, Param, StreamableFile, UseFilters, UseGuards } from "@nestjs/common";
import { SesionGuard } from "../identidad/sesion.guard";
import { UsuarioActual } from "../identidad/usuario-actual.decorator";
import type { FilaPago } from "./dominio/comprobante";
import { ErroresSuscripcionesFilter } from "./errores-suscripciones.filter";
import { HistorialPagosService } from "./historial-pagos.service";

/** Pantallas 09 y 09b: historial del cliente y descarga del comprobante. Todo con sesión. */
@Controller("suscripciones/pagos")
@UseGuards(SesionGuard)
@UseFilters(ErroresSuscripcionesFilter)
export class PagosController {
  constructor(private readonly historial: HistorialPagosService) {}

  @Get()
  pagos(@UsuarioActual("id") usuarioId: string): Promise<FilaPago[]> {
    return this.historial.deUsuario(usuarioId);
  }

  @Get(":id/comprobante.pdf")
  async comprobante(@UsuarioActual("id") usuarioId: string, @Param("id") pagoId: string): Promise<StreamableFile> {
    const { nombre, contenido } = await this.historial.pdfDe(usuarioId, pagoId);
    return new StreamableFile(contenido, { type: "application/pdf", disposition: `attachment; filename="${nombre}"` });
  }
}
