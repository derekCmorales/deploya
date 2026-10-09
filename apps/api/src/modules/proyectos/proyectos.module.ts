import { Module } from "@nestjs/common";
import { ConstruccionModule } from "../construccion/construccion.module";
import { IdentidadModule } from "../identidad/identidad.module";
import { OrquestacionModule } from "../orquestacion/orquestacion.module";
import { SuscripcionesModule } from "../suscripciones/suscripciones.module";
import { CuotaProyectosSuscripciones } from "./adaptadores/cuota-proyectos.suscripciones";
import { FuenteGitHubPublica } from "./adaptadores/fuente-github-publica";
import { ProyectosController } from "./proyectos.controller";
import { ProyectosService } from "./proyectos.service";
import { CuotaProyectosPuerto } from "./puertos/cuota-proyectos.puerto";
import { ProveedorFuente } from "./puertos/proveedor-fuente.puerto";

// Importaciones del módulo de variables (M3-03)
import { VariablesProyectoService } from "./servicios/variables-proyecto.service";
import { CifradorAesGcm } from "./adaptadores/cifrador-aes-gcm";
import { CifradorVariables } from "./puertos/cifrador-variables.puerto";
import { RepositorioVariablesPrisma } from "./adaptadores/repositorio-variables-prisma";
import { RepositorioVariables } from "./puertos/repositorio-variables.puerto";
import { PrismaModule } from "../../compartido/prisma/prisma.module";

/**
 * `RepositorioProyectos` lo provee `AdaptersModule`: el motor lee del mismo almacén.
 * La cuota sale de M2 (`cuotaDe`) y la sesión de M1 (`SesionGuard`).
 */
@Module({
  imports: [
    ConstruccionModule,
    IdentidadModule,
    SuscripcionesModule,
    OrquestacionModule,
    PrismaModule, // <-- Añadido para dar soporte a la base de datos de variables
  ],
  controllers: [ProyectosController],
  providers: [
    ProyectosService,
    {
      provide: ProveedorFuente,
      useFactory: () => new FuenteGitHubPublica(fetch, process.env.GITHUB_TOKEN, process.env.GITHUB_API_URL || undefined),
    },
    { provide: CuotaProyectosPuerto, useClass: CuotaProyectosSuscripciones },
    // Proveedores del subsistema de variables de entorno (M3-03)
    VariablesProyectoService,
    {
      provide: CifradorVariables,
      useClass: CifradorAesGcm,
    },
    {
      provide: RepositorioVariables,
      useClass: RepositorioVariablesPrisma,
    },
  ],
  exports: [
    ProyectosService,
    VariablesProyectoService, // <-- Exportado por si otros módulos necesitan gestionar variables
  ],
})
export class ProyectosModule {}