import { Module } from '@nestjs/common';
import { ConstruccionService } from './aplicacion/construccion.service';
import { ConstruccionController } from './adaptadores/construccion.controller';

@Module({
  imports: [],
  controllers: [ConstruccionController],
  providers: [ConstruccionService],
  exports: [ConstruccionService],
})
export class ConstruccionModule {}