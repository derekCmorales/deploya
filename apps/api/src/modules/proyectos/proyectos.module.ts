import { Module } from "@nestjs/common";
import { ConstruccionModule } from "../construccion/construccion.module";
import { IdentidadModule } from "../identidad/identidad.module";
import { OrquestacionModule } from "../orquestacion/orquestacion.module";
import { SuscripcionesModule } from "../suscripciones/suscripciones.module";
import { CuotaProyectosSuscripciones } from "./adaptadores/cuota-proyectos.suscripciones";
import { FuenteGitHubPublica } from "./adaptadores/fuente-github-publica";
import { ProyectosController } from "./proyectos.controller";
import { ProyectosService } from "./proyectos.service";
<<<<<<< HEAD
import { ProveedorFuente } from "./puertos/proveedor-fuente.puerto";
import { FuenteGitHubPublica } from "./adaptadores/fuente-github-publica";
import { RepositorioProyectos } from "./puertos/repositorio-proyectos.puerto";
import { RepositorioProyectosMemoria } from "./adaptadores/repositorio-proyectos.memoria";
import { CuotaProyectosPuerto } from "./puertos/cuota-proyectos.puerto";
import { CuotaProyectosStub } from "./adaptadores/cuota-proyectos.stub";
import { ConstruccionModule } from "../construccion/construccion.module";
import { Reloj } from "../../compartido/reloj";
=======
import { CuotaProyectosPuerto } from "./puertos/cuota-proyectos.puerto";
import { ProveedorFuente } from "./puertos/proveedor-fuente.puerto";
>>>>>>> origin/main

/**
 * `RepositorioProyectos` lo provee `AdaptersModule`: el motor lee del mismo almacén.
 * La cuota sale de M2 (`cuotaDe`) y la sesión de M1 (`SesionGuard`).
 */
@Module({
<<<<<<< HEAD
  imports: [ConstruccionModule],
=======
  imports: [ConstruccionModule, IdentidadModule, SuscripcionesModule, OrquestacionModule],
>>>>>>> origin/main
  controllers: [ProyectosController],
  providers: [
    ProyectosService,
    {
<<<<<<< HEAD
      provide: Reloj,
      useClass: class RelojSistema extends Reloj {
        ahora(): Date {
          return new Date();
        }
      },
    },
    {
      provide: ProveedorFuente,
      useClass: FuenteGitHubPublica,
    },
    {
      provide: RepositorioProyectos,
      useClass: RepositorioProyectosMemoria,
    },
    {
      provide: CuotaProyectosPuerto,
      useClass: CuotaProyectosStub,
    },
=======
      provide: ProveedorFuente,
      useFactory: () => new FuenteGitHubPublica(fetch, process.env.GITHUB_TOKEN, process.env.GITHUB_API_URL || undefined),
    },
    { provide: CuotaProyectosPuerto, useClass: CuotaProyectosSuscripciones },
>>>>>>> origin/main
  ],
})
export class ProyectosModule {}