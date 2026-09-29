import { Injectable, ConflictException } from '@nestjs/common';
import { ProveedorFuente } from './proveedor-fuente.abstract';
import { puertoDesdeExpose } from './puerto-expose.util';
import { ConstruccionService } from '../construccion/construccion.service';

@Injectable()
export class ProyectosService {
  constructor(
    private readonly proveedorFuente: ProveedorFuente,
    private readonly construccionService: ConstruccionService,
  ) {}

  async crearProyecto(dto: { url: string; rama: string; nombre: string; usuarioId: string }) {
    // 1. Validar el repositorio y obtener el Dockerfile usando nuestro adaptador
    const datosRepo = await this.proveedorFuente.verificarRepositorio(dto.url, dto.rama);

    // 2. Extraer el puerto usando la función pura
    const puertoInterno = puertoDesdeExpose(datosRepo.dockerfile);

    // 3. Generar un subdominio básico basado en el nombre
    const subdominio = dto.nombre.toLowerCase().replace(/[^a-z0-9-]/g, '');

    // TODO: Aquí guardarías el proyecto en tu base de datos de PostgreSQL con Prisma
    const proyectoSimulado = {
      id: 'proj-' + Date.now(),
      nombre: dto.nombre,
      subdominio,
      urlRepositorio: dto.url,
      rama: dto.rama,
      puertoInterno,
      usuarioId: dto.usuarioId,
    };

    // 4. Conectar con el motor de construcción (M3 -> M4) tal como lo pidió Derek
    const despliegue = await this.construccionService.crearDespliegue(proyectoSimulado.id, 'alta');

    return {
      proyecto: proyectoSimulado,
      despliegue,
    };
  }
}