import { Module } from "@nestjs/common";
import { configuracionEnrutamientoDesde } from "../enrutamiento/configuracion-enrutamiento";
import { IdentidadModule } from "../identidad/identidad.module";
import { VariablesModule } from "../proyectos/variables.module";
import { SuscripcionesModule } from "../suscripciones/suscripciones.module";
import { CuotaDatosSuscripciones } from "./adaptadores/cuota-datos.suscripciones";
import { GeneradorSecretosCrypto } from "./adaptadores/generador-secretos.crypto";
import { ConexionesDatos } from "./conexiones-datos";
import { DOMINIO_DATOS } from "./datos.constantes";
import { DatosController } from "./datos.controller";
import { DatosService } from "./datos.service";
import { CuotaDatosPuerto } from "./puertos/cuota-datos.puerto";
import { GeneradorSecretos } from "./puertos/generador-secretos.puerto";

/**
 * Recursos de datos en el proceso API (feat/m5-recursos-datos): sesión de M1, plan de M2 y el cifrado
 * de M3. `RepositorioRecursosDatos` y `ColaDatosPuerto` los da `AdaptersModule`. Exporta `DatosService`
 * para que M5 detenga y reanude los recursos de una cuenta junto con sus contenedores.
 */
@Module({
  imports: [IdentidadModule, SuscripcionesModule, VariablesModule],
  controllers: [DatosController],
  providers: [
    DatosService,
    ConexionesDatos,
    { provide: DOMINIO_DATOS, useFactory: () => configuracionEnrutamientoDesde(process.env) },
    { provide: CuotaDatosPuerto, useClass: CuotaDatosSuscripciones },
    { provide: GeneradorSecretos, useClass: GeneradorSecretosCrypto },
  ],
  exports: [DatosService],
})
export class DatosModule {}
