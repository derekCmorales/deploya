import { Global, Module, type DynamicModule, type Provider } from "@nestjs/common";
import Docker from "dockerode";
import { Reloj, RelojSistema } from "../compartido/reloj";
import { ClonadorRepositorioPuerto } from "../modules/construccion/puertos/clonador-repositorio.puerto";
import { ColaConstruccionPuerto } from "../modules/construccion/puertos/cola-construccion.puerto";
import { ConstructorImagenPuerto } from "../modules/construccion/puertos/constructor-imagen.puerto";
import { ProyectosLecturaPuerto } from "../modules/construccion/puertos/proyectos-lectura.puerto";
import { RepositorioArtefactos } from "../modules/construccion/puertos/repositorio-artefactos.puerto";
import { RepositorioDespliegues } from "../modules/construccion/puertos/repositorio-despliegues.puerto";
import { EnrutamientoPuerto } from "../modules/enrutamiento/puertos/enrutamiento.puerto";
import { ContenedorPuerto } from "../modules/orquestacion/puertos/contenedor.puerto";
import { CuotaPlanPuerto } from "../modules/orquestacion/puertos/cuota-plan.puerto";
import { VerificacionEntornoPuerto } from "../modules/orquestacion/puertos/verificacion-entorno.puerto";
import { RepositorioProyectos } from "../modules/proyectos/puertos/repositorio-proyectos.puerto";
import { CONFIGURACION_MOTOR, configuracionDesde, type ConfiguracionMotor } from "./configuracion-motor";
import { RepositorioArtefactosMemoria } from "./memoria/repositorio-artefactos.memoria";
import { RepositorioDesplieguesMemoria } from "./memoria/repositorio-despliegues.memoria";
import { RepositorioProyectosMemoria } from "./memoria/repositorio-proyectos.memoria";
import { ClonadorGit } from "./reales/clonador-git";
import { ColaBullMq } from "./reales/cola-bullmq";
import { ConstructorDocker } from "./reales/constructor-docker";
import { ContenedorDocker } from "./reales/contenedor-docker";
import { EnrutamientoTraefikArchivo } from "./reales/enrutamiento-traefik-archivo";
import { VerificacionHttp } from "./reales/verificacion-http";
import { ClonadorStub } from "./stubs/clonador.stub";
import { ColaMemoria } from "./stubs/cola.memoria";
import { ConstructorImagenStub } from "./stubs/constructor-imagen.stub";
import { ContenedorStub } from "./stubs/contenedor.stub";
import { CuotaPlanStub } from "./stubs/cuota-plan.stub";
import { EnrutamientoStub } from "./stubs/enrutamiento.stub";
import { VerificacionEntornoStub } from "./stubs/verificacion-entorno.stub";

type Fabrica<T> = { docker: (c: ConfiguracionMotor, reloj: Reloj) => T; stub: () => T };

/** Elige stub o real según `MOTOR_ADAPTADORES`; el único lugar que conoce las implementaciones (C3). */
export function puerto<T>(token: abstract new (...args: never[]) => T, fabrica: Fabrica<T>): Provider {
  return {
    provide: token,
    useFactory: (configuracion: ConfiguracionMotor, reloj: Reloj) =>
      configuracion.modo === "docker" ? fabrica.docker(configuracion, reloj) : fabrica.stub(),
    inject: [CONFIGURACION_MOTOR, Reloj],
  };
}

const socketDocker = (): Docker => new Docker({ socketPath: "/var/run/docker.sock" });

/**
 * Hasta que DB-01 esté en `main`, despliegues, artefactos y proyectos viven en memoria
 * en ambos modos; el adaptador Prisma los reemplaza aquí sin tocar servicios.
 * El motor lee los proyectos del mismo almacén en el que M3 los guarda.
 */
const PERSISTENCIA: Provider[] = [
  { provide: RepositorioDespliegues, useClass: RepositorioDesplieguesMemoria },
  { provide: RepositorioArtefactos, useClass: RepositorioArtefactosMemoria },
  { provide: RepositorioProyectos, useClass: RepositorioProyectosMemoria },
  { provide: ProyectosLecturaPuerto, useExisting: RepositorioProyectos },
];

const COMUNES: Provider[] = [
  { provide: CONFIGURACION_MOTOR, useFactory: () => configuracionDesde(process.env) },
  { provide: Reloj, useClass: RelojSistema },
  ...PERSISTENCIA,
  puerto(ColaConstruccionPuerto, { docker: (c) => new ColaBullMq(c.redisUrl), stub: () => new ColaMemoria() }),
];

const SOLO_TRABAJADOR: Provider[] = [
  puerto(ClonadorRepositorioPuerto, { docker: (c) => new ClonadorGit(c.directorioTrabajo), stub: () => new ClonadorStub() }),
  puerto(ConstructorImagenPuerto, { docker: () => new ConstructorDocker(socketDocker()), stub: () => new ConstructorImagenStub() }),
  puerto(ContenedorPuerto, {
    docker: (c) => new ContenedorDocker(socketDocker(), [c.traefikContenedor, c.trabajadorContenedor]),
    stub: () => new ContenedorStub(),
  }),
  puerto(VerificacionEntornoPuerto, { docker: (_c, reloj) => new VerificacionHttp(reloj), stub: () => new VerificacionEntornoStub() }),
  puerto(EnrutamientoPuerto, {
    docker: (c) =>
      new EnrutamientoTraefikArchivo({ directorio: c.traefikDinamico, dominio: c.dominioApps, esquema: c.esquemaApps }),
    stub: () => new EnrutamientoStub(),
  }),
  { provide: CuotaPlanPuerto, useClass: CuotaPlanStub },
];

const tokens = (proveedores: Provider[]) => proveedores.map((p) => (typeof p === "function" ? p : p.provide));

@Global()
@Module({})
export class AdaptersModule {
  /** Proceso API: solo produce trabajos y lee; nunca recibe adaptadores de Docker. */
  static paraApi(): DynamicModule {
    return { module: AdaptersModule, providers: COMUNES, exports: tokens(COMUNES) };
  }

  /** Proceso trabajador: además clona, construye, corre contenedores y publica rutas. */
  static paraTrabajador(): DynamicModule {
    const proveedores = [...COMUNES, ...SOLO_TRABAJADOR];
    return { module: AdaptersModule, providers: proveedores, exports: tokens(proveedores) };
  }
}
