import type { ArgumentsHost } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AdaptersModule } from "../../adapters/adapters.module";
import { RepositorioArtefactosMemoria } from "../../adapters/memoria/repositorio-artefactos.memoria";
import { RepositorioDesplieguesMemoria } from "../../adapters/memoria/repositorio-despliegues.memoria";
import { RepositorioProyectosMemoria } from "../../adapters/memoria/repositorio-proyectos.memoria";
import { CuotaPlanStub } from "../../adapters/stubs/cuota-plan.stub";
import { PrismaModule } from "../../compartido/prisma/prisma.module";
import { PrismaService } from "../../compartido/prisma/prisma.service";
import { RelojFijo } from "../../compartido/reloj";
import { RepositorioArtefactos } from "../construccion/puertos/repositorio-artefactos.puerto";
import { RepositorioDespliegues } from "../construccion/puertos/repositorio-despliegues.puerto";
import { ConstruccionService } from "../construccion/construccion.service";
import { ProyectosLecturaPuerto } from "../construccion/puertos/proyectos-lectura.puerto";
import { CuotaPlanPuerto } from "../orquestacion/puertos/cuota-plan.puerto";
import {
  DatosAltaInvalidos,
  ErrorProyectos,
  ConfirmacionNoCoincide,
  FuenteNoDisponible,
  LimiteProyectosAlcanzado,
  ProyectoNoEncontrado,
  RamaNoEncontrada,
  RepositorioNoAccesible,
  RepositorioSinDockerfile,
  SubdominioEnUso,
  UrlRepositorioInvalida,
} from "./dominio/errores";
import type { ConsultaRepositorio, ValidacionRepositorio } from "./dominio/proyecto";
import { CuotaProyectosStub } from "./adaptadores/cuota-proyectos.stub";
import { ErroresProyectosFilter } from "./errores-proyectos.filter";
import { ProyectosController } from "./proyectos.controller";
import { ProyectosModule } from "./proyectos.module";
import { CuotaProyectosPuerto } from "./puertos/cuota-proyectos.puerto";
import { ProveedorFuente } from "./puertos/proveedor-fuente.puerto";
import { RepositorioProyectos } from "./puertos/repositorio-proyectos.puerto";

class FuenteDoble extends ProveedorFuente {
  async validar({ rama }: ConsultaRepositorio): Promise<ValidacionRepositorio> {
    return {
      accesible: true,
      urlNormalizada: "https://github.com/derekCmorales/hola-deploya",
      repositorio: "derekCmorales/hola-deploya",
      rama,
      ramas: ["main"],
      commit: { sha: "a1b2c3d", mensaje: "feat: hola", autor: "Derek", fecha: "2026-09-29T10:00:00Z" },
      dockerfile: "FROM node\nEXPOSE 3000",
      puerto: 3000,
    };
  }
}

/**
 * Nest real (DI, AdaptersModule en modo stub, motor, M1 y M3) con GitHub como doble y la
 * persistencia en memoria: sin base de datos, la cuota queda en Sandbox.
 */
async function montarApi() {
  // Asegurar clave de cifrado requerida por CifradorAesGcm en el módulo de proyectos
  process.env.CLAVE_CIFRADO_VARIABLES = "12345678901234567890123456789012";

  const modulo = await Test.createTestingModule({ imports: [AdaptersModule.paraApi(), PrismaModule, ProyectosModule] })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(ProveedorFuente)
    .useValue(new FuenteDoble())
    .overrideProvider(RepositorioProyectos)
    .useValue(new RepositorioProyectosMemoria(new RelojFijo()))
    .overrideProvider(RepositorioDespliegues)
    .useValue(new RepositorioDesplieguesMemoria())
    .overrideProvider(RepositorioArtefactos)
    .useValue(new RepositorioArtefactosMemoria())
    .overrideProvider(CuotaProyectosPuerto)
    .useValue(new CuotaProyectosStub())
    .overrideProvider(CuotaPlanPuerto)
    .useValue(new CuotaPlanStub())
    .compile();
  return {
    controlador: modulo.get(ProyectosController),
    repositorio: modulo.get(RepositorioProyectos),
    lecturaMotor: modulo.get(ProyectosLecturaPuerto),
    motor: modulo.get(ConstruccionService),
  };
}

function respuestaFalsa() {
  const respuesta = {
    estado: 0,
    cuerpo: {} as unknown,
    status(e: number) {
      this.estado = e;
      return this;
    },
    json(c: unknown) {
      this.cuerpo = c;
    },
  };
  const host = { switchToHttp: () => ({ getResponse: () => respuesta }) } as unknown as ArgumentsHost;
  return { respuesta, host };
}

describe("ProyectosController", () => {
  it("health del módulo", async () => {
    const { controlador } = await montarApi();
    expect(controlador.health()).toEqual({ status: "ok", module: "proyectos" });
  });

  it("El motor encuentra el proyecto: POST /proyectos guarda en el almacén que lee M4 y deja el despliegue #1 encolado", async () => {
    const { controlador, lecturaMotor, motor } = await montarApi();

    const { proyecto, despliegue } = await controlador.crear("usuario-1", {
      url: "https://github.com/derekCmorales/hola-deploya.git",
      nombre: "hola-deploya",
    });

    expect(despliegue).toMatchObject({ numero: 1, estado: "encolado" });
    expect(await lecturaMotor.porId(proyecto.id)).toMatchObject({ usuarioId: "usuario-1", subdominio: "hola-deploya", puertoInterno: 3000 });
    expect((await motor.consultar(despliegue.id, "usuario-1")).proyectoId).toBe(proyecto.id);
  });

  it("GET /proyectos lista solo los del usuario de la sesión, con su último despliegue", async () => {
    const { controlador } = await montarApi();
    await controlador.crear("usuario-1", { url: "https://github.com/derekCmorales/hola-deploya", nombre: "hola" });

    const propia = await controlador.listar("usuario-1");
    const ajena = await controlador.listar("usuario-2");

    expect(propia.proyectos).toHaveLength(1);
    expect(propia.proyectos[0].ultimoDespliegue).toMatchObject({ numero: 1, estado: "encolado" });
    expect(propia).toMatchObject({ usados: 1, maximo: 1 });
    expect(ajena.proyectos).toHaveLength(0);
  });

  it("DELETE /proyectos/:id borra el proyecto del usuario de la sesión y libera su cupo", async () => {
    const { controlador, repositorio } = await montarApi();
    const { proyecto } = await controlador.crear("usuario-1", { url: "https://github.com/derekCmorales/hola-deploya", nombre: "hola" });

    await controlador.eliminar("usuario-1", proyecto.id, { confirmacion: " hola " });

    expect(await repositorio.porId(proyecto.id)).toBeNull();
    expect((await controlador.listar("usuario-1")).usados).toBe(0);
  });

  it("DELETE sin confirmación en el cuerpo no toca el proyecto", async () => {
    const { controlador, repositorio } = await montarApi();
    const { proyecto } = await controlador.crear("usuario-1", { url: "https://github.com/derekCmorales/hola-deploya", nombre: "hola" });

    await expect(controlador.eliminar("usuario-1", proyecto.id, {})).rejects.toThrow(ConfirmacionNoCoincide);
    expect(() => controlador.eliminar("usuario-1", proyecto.id, undefined)).toThrow(DatosAltaInvalidos);

    expect(await repositorio.porId(proyecto.id)).not.toBeNull();
  });

  it("el cuerpo se valida antes de llegar al servicio", async () => {
    const { controlador, repositorio } = await montarApi();
    expect(() => controlador.crear("usuario-1", { url: "https://gitlab.com/a/b", nombre: "x" })).toThrow(UrlRepositorioInvalida);
    expect(() => controlador.validarRepositorio(null)).toThrow(DatosAltaInvalidos);
    expect(await repositorio.deUsuario("usuario-1")).toHaveLength(0);
  });

  it.each<[ErrorProyectos, number, Record<string, unknown>]>([
    [new UrlRepositorioInvalida(), 400, { codigo: "url-invalida" }],
    [new DatosAltaInvalidos("x"), 400, { codigo: "datos-invalidos" }],
    [new RepositorioNoAccesible(404), 422, { codigo: "repositorio-no-accesible", estadoHttp: 404 }],
    [new RamaNoEncontrada("dev"), 422, { codigo: "rama-no-encontrada", rama: "dev" }],
    [new RepositorioSinDockerfile("main"), 422, { codigo: "sin-dockerfile", rama: "main" }],
    [new FuenteNoDisponible(), 503, { codigo: "fuente-no-disponible" }],
    [new SubdominioEnUso("hola"), 409, { codigo: "subdominio-en-uso", subdominio: "hola" }],
    [new LimiteProyectosAlcanzado(1), 409, { codigo: "limite-proyectos", maximo: 1 }],
    [new ProyectoNoEncontrado("p-1"), 404, { codigo: "proyecto-no-encontrado" }],
    [new ConfirmacionNoCoincide(), 400, { codigo: "confirmacion-no-coincide" }],
  ])("el filtro traduce %p a HTTP %i con su código", (error, estado, cuerpo) => {
    const { respuesta, host } = respuestaFalsa();
    new ErroresProyectosFilter().catch(error, host);
    expect(respuesta.estado).toBe(estado);
    expect(respuesta.cuerpo).toMatchObject({ ...cuerpo, mensaje: error.message });
  });
});