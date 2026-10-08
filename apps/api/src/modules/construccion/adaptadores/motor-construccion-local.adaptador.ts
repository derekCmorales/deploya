import { Injectable, Logger } from '@nestjs/common';
import { MotorConstruccionPuerto } from '../puertos/motor-construccion.puerto';
import { RepositorioConstruccion } from '../puertos/repositorio-construccion.puerto';

@Injectable()
export class MotorConstruccionLocalAdaptador implements MotorConstruccionPuerto {
  private readonly logger = new Logger(MotorConstruccionLocalAdaptador.name);

  constructor(private repositorioConstruccion: RepositorioConstruccion) {}

  async ejecutarConstruccion(construccionId: string, urlRepo: string, rama: string): Promise<void> {
    try {
      // 1. Estado: Clonando
      await this.repositorioConstruccion.actualizarEstado(
        construccionId, 
        'CLONANDO', 
        `[1/3] Clonando repositorio desde ${urlRepo} (rama: ${rama})...`
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 2. Estado: Construyendo
      await this.repositorioConstruccion.actualizarEstado(
        construccionId, 
        'CONSTRUYENDO', 
        `[2/3] Instalando dependencias y compilando artefactos...`
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 3. Estado: Exitoso
      await this.repositorioConstruccion.actualizarEstado(
        construccionId, 
        'EXITOSO', 
        `[3/3] ¡Construcción finalizada y artefactos empaquetados con éxito!`
      );
    } catch (error: any) {
      this.logger.error(`Error en la construcción ${construccionId}: ${error.message}`);
      await this.repositorioConstruccion.actualizarEstado(
        construccionId, 
        'FALLIDO', 
        `Error crítico durante el proceso: ${error.message}`
      );
    }
  }
}