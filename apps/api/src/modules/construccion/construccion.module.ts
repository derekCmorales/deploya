import { Module } from '@nestjs/common';
import { ConstruccionService } from './aplicacion/construccion.service';
import { ConstruccionController } from './adaptadores/construccion.controller';
import { PrismaConstruccionRepositorio } from './adaptadores/prisma-construccion.repositorio';
import { MotorConstruccionLocalAdaptador } from './adaptadores/motor-construccion-local.adaptador';
import { RepositorioConstruccion } from './puertos/repositorio-construccion.puerto';
import { MotorConstruccionPuerto } from './puertos/motor-construccion.puerto';
import { PrismaService } from '../../compartido/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [ConstruccionController],
  providers: [
    ConstruccionService,
    PrismaService,
    {
      provide: RepositorioConstruccion,
      useClass: PrismaConstruccionRepositorio,
    },
    {
      provide: MotorConstruccionPuerto,
      useClass: MotorConstruccionLocalAdaptador,
    },
  ],
})
export class ConstruccionModule {}