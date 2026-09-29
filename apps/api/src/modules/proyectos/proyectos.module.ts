import { Module } from "@nestjs/common";
import { ConstruccionModule } from "../construccion/construccion.module";
import { CuotaProyectosStub } from "./adaptadores/cuota-proyectos.stub";
import { FuenteGitHubPublica } from "./adaptadores/fuente-github-publica";
import { ProyectosController } from "./proyectos.controller";
import { ProyectosService } from "./proyectos.service";
import { CuotaProyectosPuerto } from "./puertos/cuota-proyectos.puerto";
import { ProveedorFuente } from "./puertos/proveedor-fuente.puerto";

/** `RepositorioProyectos` lo provee `AdaptersModule`: el motor lee del mismo almacén. */
@Module({
  imports: [ConstruccionModule],
  controllers: [ProyectosController],
  providers: [
    ProyectosService,
    {
      provide: ProveedorFuente,
      useFactory: () => new FuenteGitHubPublica(fetch, process.env.GITHUB_TOKEN, process.env.GITHUB_API_URL || undefined),
    },
    { provide: CuotaProyectosPuerto, useClass: CuotaProyectosStub },
  ],
})
export class ProyectosModule {}
