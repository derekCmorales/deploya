import { Global, Module, type DynamicModule, type Provider } from "@nestjs/common";
import Docker from "dockerode";
import { Reloj, RelojSistema } from "../compartido/reloj";
import { CancelacionesPuerto } from "../modules/construccion/puertos/cancelaciones.puerto";
import { ClonadorRepositorioPuerto } from "../modules/construccion/puertos/clonador-repositorio.puerto";
import { ColaConstruccionPuerto } from "../modules/construccion/puertos/cola-construccion.puerto";
import { ConstructorImagenPuerto } from "../modules/construccion/puertos/constructor-imagen.puerto";
import { ProyectosLecturaPuerto } from "../modules/construccion/puertos/proyectos-lectura.puerto";
import { RecetaProyectoPuerto } from "../modules/construccion/puertos/receta-proyecto.puerto";
import { RepositorioArtefactos } from "../modules/construccion/puertos/repositorio-artefactos.puerto";
import { RepositorioDespliegues } from "../modules/construccion/puertos/repositorio-despliegues.puerto";
import { DetalleProyectoPuerto } from "../modules/observabilidad/puertos/detalle-proyecto.puerto";
import { SalidaContenedorPuerto } from "../modules/observabilidad/puertos/salida-contenedor.puerto";
import { MetricasNodoPuerto } from "../modules/administracion/infraestructura/puertos/metricas-nodo.puerto";
import { MetricasNodoSistema } from "./reales/metricas-nodo";
import { MetricasNodoStub } from "./stubs/metricas-nodo.stub";
import { CertificadoPuerto } from "../modules/enrutamiento/puertos/certificado.puerto";
import { EnrutamientoPuerto } from "../modules/enrutamiento/puertos/enrutamiento.puerto";
import { ColaOperacionPuerto } from "../modules/orquestacion/puertos/cola-operacion.puerto";
import { ContenedorPuerto } from "../modules/orquestacion/puertos/contenedor.puerto";
import { MetricasContenedorPuerto } from "../modules/orquestacion/puertos/metricas-contenedor.puerto";
import { MuestrasMetricas } from "../modules/orquestacion/puertos/muestras-metricas.puerto";
import { VerificacionEntornoPuerto } from "../modules/orquestacion/puertos/verificacion-entorno.puerto";
import { RepositorioProyectos } from "../modules/proyectos/puertos/repositorio-proyectos.puerto";
import { RepositorioVariables } from "../modules/proyectos/puertos/repositorio-variables.puerto";
import { LecturaServidorPuerto, ReporteServidorPuerto } from "../modules/administracion/instalacion/puertos/reporte-servidor.puerto";
import { RegistroEnviosCorreo } from "../modules/notificaciones/puertos/registro-envios.puerto";
import { CONFIGURACION_MOTOR, configuracionDesde, type ConfiguracionMotor } from "./configuracion-motor";
import { RegistroEnviosRedis, ReporteServidorRedis } from "./reales/estado-compartido-redis";
import { LecturaServidorDocker } from "./reales/lectura-servidor-docker";
import { RegistroEnviosMemoria, ReporteServidorMemoria } from "./stubs/estado-compartido.memoria";
import { LecturaServidorStub } from "./stubs/lectura-servidor.stub";
import { SalidaContenedorBullMq } from "./reales/salida-contenedor-bullmq";
import { SalidaContenedorMemoria } from "./stubs/salida-contenedor.memoria";
import { RecetaProyectoPrisma } from "./prisma/receta-proyecto.prisma";
import { RepositorioArtefactosPrisma } from "./prisma/repositorio-artefactos.prisma";
import { RepositorioDesplieguesPrisma } from "./prisma/repositorio-despliegues.prisma";
import { RepositorioProyectosPrisma } from "./prisma/repositorio-proyectos.prisma";
import { MuestrasMetricasPrisma } from "./prisma/muestras-metricas.prisma";
import { RepositorioVariablesPrisma } from "./prisma/repositorio-variables.prisma";
import { ClonadorGit } from "./reales/clonador-git";
import { CancelacionesRedis } from "./reales/cancelaciones-redis";
import { CertificadoAcmeArchivo } from "./reales/certificado-acme-archivo";
import { ColaBullMq, ColaOperacionBullMq } from "./reales/cola-bullmq";
import { ConstructorDocker } from "./reales/constructor-docker";
import { ContenedorDocker } from "./reales/contenedor-docker";
import { MetricasDockerStats } from "./reales/metricas-docker-stats";
import { EnrutamientoTraefikArchivo } from "./reales/enrutamiento-traefik-archivo";
import { VerificacionHttp } from "./reales/verificacion-http";
import { CancelacionesMemoria } from "./stubs/cancelaciones.memoria";
import { CertificadoAusente } from "./stubs/certificado-ausente";
import { ClonadorStub } from "./stubs/clonador.stub";
import { ColaMemoria } from "./stubs/cola.memoria";
import { ColaOperacionMemoria } from "./stubs/cola-operacion.memoria";
import { ConstructorImagenStub } from "./stubs/constructor-imagen.stub";
import { ContenedorStub } from "./stubs/contenedor.stub";
import { MetricasContenedorStub } from "./stubs/metricas-contenedor.stub";
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

/** Admin · Infraestructura (SP-13) mide el disco donde viven imágenes y artefactos: la raíz del nodo. */
const RAIZ_NODO = "/";

const socketDocker = (): Docker => new Docker({ socketPath: "/var/run/docker.sock" });

/**
 * Despliegues, artefactos y proyectos en PostgreSQL (DB-01) en ambos modos: la API y el
 * trabajador son procesos distintos y solo comparten la base. Los repositorios en memoria
 * quedan para las pruebas. El motor lee los proyectos del mismo almacén en el que M3 los guarda.
 */
const PERSISTENCIA: Provider[] = [
  { provide: RepositorioDespliegues, useClass: RepositorioDesplieguesPrisma },
  { provide: RepositorioArtefactos, useClass: RepositorioArtefactosPrisma },
  { provide: RepositorioProyectos, useClass: RepositorioProyectosPrisma },
  { provide: RepositorioVariables, useClass: RepositorioVariablesPrisma },
  { provide: ProyectosLecturaPuerto, useExisting: RepositorioProyectos },
  { provide: DetalleProyectoPuerto, useExisting: RepositorioProyectos },
  { provide: RecetaProyectoPuerto, useClass: RecetaProyectoPrisma },
  { provide: MuestrasMetricas, useClass: MuestrasMetricasPrisma },
];

const COMUNES: Provider[] = [
  { provide: CONFIGURACION_MOTOR, useFactory: () => configuracionDesde(process.env) },
  { provide: Reloj, useClass: RelojSistema },
  ...PERSISTENCIA,
  puerto(ColaConstruccionPuerto, { docker: (c) => new ColaBullMq(c.redisUrl), stub: () => new ColaMemoria() }),
  puerto(CertificadoPuerto, {
    docker: (c) => (c.enrutamiento.certResolver ? new CertificadoAcmeArchivo(c.acmeArchivo) : new CertificadoAusente()),
    stub: () => new CertificadoAusente(),
  }),
  puerto(CancelacionesPuerto, { docker: (c) => new CancelacionesRedis(c.redisUrl), stub: () => new CancelacionesMemoria() }),
  puerto(ColaOperacionPuerto, { docker: (c) => new ColaOperacionBullMq(c.redisUrl), stub: () => new ColaOperacionMemoria() }),
  puerto(RegistroEnviosCorreo, { docker: (c) => new RegistroEnviosRedis(c.redisUrl), stub: () => new RegistroEnviosMemoria() }),
  puerto(ReporteServidorPuerto, { docker: (c) => new ReporteServidorRedis(c.redisUrl), stub: () => new ReporteServidorMemoria() }),
  puerto(SalidaContenedorPuerto, { docker: (c) => new SalidaContenedorBullMq(c.redisUrl), stub: () => new SalidaContenedorMemoria() }),
  puerto(MetricasNodoPuerto, { docker: () => new MetricasNodoSistema(RAIZ_NODO), stub: () => new MetricasNodoStub() }),
];

const SOLO_TRABAJADOR: Provider[] = [
  puerto(ClonadorRepositorioPuerto, { docker: (c) => new ClonadorGit(c.directorioTrabajo), stub: () => new ClonadorStub() }),
  puerto(ConstructorImagenPuerto, { docker: () => new ConstructorDocker(socketDocker()), stub: () => new ConstructorImagenStub() }),
  puerto(ContenedorPuerto, {
    docker: (c) => new ContenedorDocker(socketDocker(), [c.traefikContenedor, c.trabajadorContenedor]),
    stub: () => new ContenedorStub(),
  }),
  puerto(VerificacionEntornoPuerto, { docker: (_c, reloj) => new VerificacionHttp(reloj), stub: () => new VerificacionEntornoStub() }),
  puerto(MetricasContenedorPuerto, { docker: () => new MetricasDockerStats(), stub: () => new MetricasContenedorStub() }),
  puerto(LecturaServidorPuerto, {
    docker: (c) => new LecturaServidorDocker(socketDocker(), c.directorioTrabajo, c.proyectoCompose),
    stub: () => new LecturaServidorStub(),
  }),
  puerto(EnrutamientoPuerto, {
    docker: (c) =>
      new EnrutamientoTraefikArchivo({ directorio: c.traefikDinamico, ...c.enrutamiento }),
    stub: () => new EnrutamientoStub(),
  }),
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
