import { Global, Module } from "@nestjs/common";
import { ContenedorPuerto } from "./contenedor.puerto";
import { ContenedorStub } from "./contenedor.stub";
import { EnrutamientoPuerto } from "./enrutamiento.puerto";
import { EnrutamientoStub } from "./enrutamiento.stub";
import { VerificacionEntornoPuerto } from "./verificacion-entorno.puerto";
import { VerificacionEntornoStub } from "./verificacion-entorno.stub";
import { ColaConstruccionStub } from "./cola-construccion.stub";

@Global()
@Module({
  providers: [
    { provide: ContenedorPuerto, useClass: ContenedorStub },
    { provide: EnrutamientoPuerto, useClass: EnrutamientoStub },
    { provide: VerificacionEntornoPuerto, useClass: VerificacionEntornoStub },
    ColaConstruccionStub,
  ],
  exports: [
    ContenedorPuerto,
    EnrutamientoPuerto,
    VerificacionEntornoPuerto,
    ColaConstruccionStub,
  ],
})
export class AdaptersModule {}
