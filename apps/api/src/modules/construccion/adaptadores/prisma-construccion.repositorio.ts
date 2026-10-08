import { Injectable } from '@nestjs/common';
import { RepositorioConstruccion } from '../puertos/repositorio-construccion.puerto';
import { Construccion, EstadoConstruccion } from '../dominio/construccion';
import { PrismaService } from '../../../compartido/prisma/prisma.service';

@Injectable()
export class PrismaConstruccionRepositorio implements RepositorioConstruccion {
  constructor(private prisma: PrismaService) {}

  async iniciar(proyectoId: string): Promise<Construccion> {
    const creada = await (this.prisma as any).construccion.create({
      data: {
        proyectoId,
        estado: 'PENDIENTE',
        logs: 'Iniciando proceso de construcción...\n',
      },
    });
    return this.mapear(creada);
  }

  async actualizarEstado(id: string, estado: EstadoConstruccion, logsAdicionales?: string): Promise<void> {
    const actual = await (this.prisma as any).construccion.findUnique({ where: { id } });
    const nuevosLogs = logsAdicionales 
      ? (actual?.logs || '') + logsAdicionales + '\n' 
      : (actual?.logs || '');
    
    await (this.prisma as any).construccion.update({
      where: { id },
      data: {
        estado,
        logs: nuevosLogs,
      },
    });
  }

  async porId(id: string): Promise<Construccion | null> {
    const c = await (this.prisma as any).construccion.findUnique({ where: { id } });
    return c ? this.mapear(c) : null;
  }

  async deProyecto(proyectoId: string): Promise<Construccion[]> {
    const lista = await (this.prisma as any).construccion.findMany({ where: { proyectoId } });
    return lista.map(this.mapear);
  }

  private mapear(item: any): Construccion {
    return {
      id: item.id,
      proyectoId: item.proyectoId,
      estado: item.estado as EstadoConstruccion,
      logs: item.logs,
      creado: item.creado || item.createdAt,
    };
  }
}