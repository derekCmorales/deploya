import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { Reflector } from "@nestjs/core";
import { RelojFijo } from "../../../compartido/reloj";
import type { UsuarioSesion } from "../../identidad/dominio/sesion";
import { RolGuard, SOLO_ADMINISTRACION } from "../../identidad/rol.guard";
import { SesionGuard } from "../../identidad/sesion.guard";
import { planesDePrueba } from "../adaptadores/planes.fixture";
import { RepositorioSuscripcionesMemoria } from "../adaptadores/repositorio-suscripciones.memoria";
import { CicloController } from "./ciclo.controller";
import { CicloSuscripcionService } from "./ciclo-suscripcion.service";
import { AvisosFalso } from "./avisos.falso";
import { ContenedoresClienteFalso } from "./contenedores-cliente.falso";

const CLIENTE: UsuarioSesion = { id: "u-cliente", correo: "cliente@deploya.app", nombre: "Cliente Demo", rol: "cliente" };
const ADMINISTRADOR: UsuarioSesion = { id: "u-admin", correo: "admin@deploya.app", nombre: "Administrador", rol: "administrador" };

function contextoEjecutar(usuario: UsuarioSesion): ExecutionContext {
  return {
    getClass: () => CicloController,
    getHandler: () => CicloController.prototype.ejecutar,
    switchToHttp: () => ({ getRequest: () => ({ headers: {}, usuario }) }),
  } as unknown as ExecutionContext;
}

function errorDe(ejecutar: () => unknown): unknown {
  try {
    ejecutar();
    return null;
  } catch (error) {
    return error;
  }
}

describe("M2-05 · POST /admin/ciclo/ejecutar", () => {
  const guard = new RolGuard(new Reflector());

  it("exige sesión y rol administrador", () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, CicloController)).toEqual([SesionGuard, RolGuard]);
  });

  it("un Cliente en /admin/ciclo/ejecutar recibe 403", () => {
    const error = errorDe(() => guard.canActivate(contextoEjecutar(CLIENTE)));

    expect(error).toBeInstanceOf(ForbiddenException);
    expect((error as ForbiddenException).getResponse()).toEqual(SOLO_ADMINISTRACION);
  });

  it("el administrador lo corre y recibe { cambios: [{ usuarioId, de, a }] }", async () => {
    const suscripciones = new RepositorioSuscripcionesMemoria(planesDePrueba());
    await suscripciones.crearSiNoExiste({
      usuarioId: "u-vencida",
      planId: "plan-starter",
      estado: "vencida",
      vigenciaDias: 30,
      inicio: new Date("2026-10-31T00:05:00.000Z"),
      vence: new Date("2026-10-31T00:05:00.000Z"),
    });
    const controlador = new CicloController(
      new CicloSuscripcionService(suscripciones, new ContenedoresClienteFalso(), new AvisosFalso(), new RelojFijo(new Date("2026-11-05T00:05:00.000Z"))),
    );

    expect(guard.canActivate(contextoEjecutar(ADMINISTRADOR))).toBe(true);
    await expect(controlador.ejecutar()).resolves.toEqual({ cambios: [{ usuarioId: "u-vencida", de: "vencida", a: "suspendida" }] });
  });
});
