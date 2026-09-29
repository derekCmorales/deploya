import { Controller, Post, Body } from '@nestjs/common';
import { ProyectosService } from './proyectos.service';

@Controller('proyectos')
export class ProyectosController {
  constructor(private readonly proyectosService: ProyectosService) {}

  @Post()
  async crearProyecto(
    @Body() body: { url: string; rama: string; nombre: string; usuarioId: string },
  ) {
    return this.proyectosService.crearProyecto(body);
  }
}