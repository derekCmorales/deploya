import { Module } from "@nestjs/common";
import { ConstruccionModule } from "../construccion/construccion.module";
import { DatosModule } from "../datos/datos.module";
import { IdentidadModule } from "../identidad/identidad.module";
import { OrquestacionModule } from "../orquestacion/orquestacion.module";
import { SuscripcionesModule } from "../suscripciones/suscripciones.module";
import { CuotaProyectosSuscripciones } from "./adaptadores/cuota-proyectos.suscripciones";
import { FuenteGitHubPublica } from "./adaptadores/fuente-github-publica";
import { ProyectosController } from "./proyectos.controller";
import { ProyectosService } from "./proyectos.service";
import { configuracionEnrutamientoDesde } from "../enrutamiento/configuracion-enrutamiento";
import { SUBDOMINIOS_DE_PLATAFORMA, SUBDOMINIOS_RESERVADOS } from "./dominio/subdominio";
import { CuotaProyectosPuerto } from "./puertos/cuota-proyectos.puerto";
import { ProveedorFuente } from "./puertos/proveedor-fuente.puerto";
import { RecursosDatosAlta } from "./puertos/recursos-datos-alta.puerto";
import { RecursosDatosAltaDatos } from "./adaptadores/recursos-datos-alta.datos";
import { VariablesModule } from "./variables.module";

/**
 * `RepositorioProyectos` lo provee `AdaptersModule`: el motor lee del mismo almacén.
 * La cuota sale de M2 (`cuotaDe`) y la sesión de M1 (`SesionGuard`).
 */
@Module({
  imports: [ConstruccionModule, IdentidadModule, SuscripcionesModule, OrquestacionModule, VariablesModule, DatosModule],
  controllers: [ProyectosController],
  providers: [
    ProyectosService,
    {
      provide: ProveedorFuente,
      useFactory: () => new FuenteGitHubPublica(fetch, process.env.GITHUB_TOKEN, process.env.GITHUB_API_URL || undefined),
    },
    { provide: CuotaProyectosPuerto, useClass: CuotaProyectosSuscripciones },
    { provide: RecursosDatosAlta, useClass: RecursosDatosAltaDatos },
    // Con TLS (VPS) la web y la API ocupan la raíz y api.<dominio>: un proyecto no puede quitárselos.
    {
      provide: SUBDOMINIOS_RESERVADOS,
      useFactory: () => (configuracionEnrutamientoDesde(process.env).certResolver ? SUBDOMINIOS_DE_PLATAFORMA : []),
    },
  ],
  exports: [CuotaProyectosPuerto],
})
export class ProyectosModule {}
