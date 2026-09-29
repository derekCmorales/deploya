import { Module } from '@nestjs/common';
import { ProyectosController } from './proyectos.controller';
import { ProyectosService } from './proyectos.service';
import { ProveedorFuente } from './proveedor-fuente.abstract';
import { FuenteGitHubPublica } from './fuente-github-publica.adapter';
import { ConstruccionModule } from '../construccion/construccion.module';

@Module({
  imports: [ConstruccionModule],
  controllers: [ProyectosController],
  providers: [
    ProyectosService,
    {
      provide: ProveedorFuente,
      useClass: FuenteGitHubPublica,
    },
  ],
})
export class ProyectosModule {}