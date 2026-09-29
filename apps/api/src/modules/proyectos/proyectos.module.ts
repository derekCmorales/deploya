import { Module } from "@nestjs/common";
import { ProyectosController } from "./proyectos.controller";
import { ProyectosService } from "./proyectos.service";
import { ProveedorFuente } from "./puertos/proveedor-fuente.puerto";
import { FuenteGitHubPublica } from "./adaptadores/fuente-github-publica";
import { RepositorioProyectos } from "./puertos/repositorio-proyectos.puerto";
import { RepositorioProyectosMemoria } from "./adaptadores/repositorio-proyectos.memoria";
import { CuotaProyectosPuerto } from "./puertos/cuota-proyectos.puerto";
import { CuotaProyectosStub } from "./adaptadores/cuota-proyectos.stub";
import { ConstruccionModule } from "../construccion/construccion.module";
import { Reloj } from "../../compartido/reloj";

@Module({
  imports: [ConstruccionModule],
  controllers: [ProyectosController],
  providers: [
    ProyectosService,
    {
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
  ],
})
export class ProyectosModule {}