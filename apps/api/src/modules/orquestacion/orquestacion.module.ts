import { Module } from "@nestjs/common";
import { OrquestacionController } from "./orquestacion.controller";

@Module({
  controllers: [OrquestacionController],
})
export class OrquestacionModule {}
