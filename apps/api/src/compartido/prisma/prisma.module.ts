import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // <--- ¡Asegúrate de que esta línea esté presente!
})
export class PrismaModule {}