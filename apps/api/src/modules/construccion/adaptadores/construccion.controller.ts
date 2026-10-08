import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ConstruccionService } from '../aplicacion/construccion.service';

@Controller('construcciones')
export class ConstruccionController {
  constructor(private readonly construccionService: ConstruccionService) {}

  @Post()
  async desplegar(@Body() body: { proyectoId: string; urlRepo: string; rama: string }) {
    return await this.construccionService.iniciarDespliegue(
      body.proyectoId,
      body.urlRepo,
      body.rama || 'main',
    );
  }

  @Get(':id')
  async obtener(@Param('id') id: string) {
    return await this.construccionService.obtenerPorId(id);
  }

  @Get('proyecto/:proyectoId')
  async listarPorProyecto(@Param('proyectoId') proyectoId: string) {
    return await this.construccionService.listarPorProyecto(proyectoId);
  }
}