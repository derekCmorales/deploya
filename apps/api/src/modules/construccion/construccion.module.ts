import { Module } from "@nestjs/common";
import { ConstruccionController } from "./construccion.controller";

@Module({
  controllers: [ConstruccionController],
})
export class ConstruccionModule {}
