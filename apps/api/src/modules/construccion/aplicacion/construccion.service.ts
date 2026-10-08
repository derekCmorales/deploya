import { Injectable, NotFoundException } from '@nestjs/common';
import { RepositorioConstruccion } from '../puertos/repositorio-construccion.puerto';
import { MotorConstruccionPuerto } from '../puertos/motor-construccion.puerto';

@Injectable()
export class ConstruccionService {
  constructor(
    private readonly repositorioConstruccion: RepositorioConstruccion,
    private readonly motorConstruccion: MotorConstruccionPuerto,
  ) {}

  async iniciarDespliegue(proyectoId: string, urlRepo: string, rama: string) {
    const construccion = await this.repositorioConstruccion.iniciar(proyectoId);
    
    // Ejecutamos la simulación/compilación de forma asíncrona sin bloquear la petición HTTP
    this.motorConstruccion.ejecutarConstruccion(construccion.id, urlRepo, rama);

    return {
      mensaje: 'Proceso de construcción e iniciado con éxito',
      construccionId: construccion.id,
      estado: construccion.estado,
    };
  }

  async obtenerPorId(id: string) {
    const construccion = await this.repositorioConstruccion.porId(id);
    if (!construccion) {
      throw new NotFoundException('Construcción no encontrada');
    }
    return construccion;
  }

  async listarPorProyecto(proyectoId: string) {
    return await this.repositorioConstruccion.deProyecto(proyectoId);
  }
}