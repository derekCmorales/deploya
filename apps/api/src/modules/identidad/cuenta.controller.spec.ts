import { UnauthorizedException, type ArgumentsHost, type ExecutionContext } from "@nestjs/common";
import { GUARDS_METADATA, HTTP_CODE_METADATA } from "@nestjs/common/constants";
import type { Request, Response } from "express";
import { COOKIE_SESION, cookieSesionVencida } from "./cookie-sesion";
import { CuentaController } from "./cuenta.controller";
import type { CuentaService } from "./cuenta.service";
import { ContrasenaActualIncorrecta, ContrasenaRepetida, CuentaInexistente, NombreInvalido } from "./dominio/errores";
import { ErroresIdentidadFilter } from "./errores-identidad.filter";
import { SesionGuard } from "./sesion.guard";
import type { SesionService } from "./sesion.service";

const LOCAL = { segura: false };
const PERFIL = { nombre: "Derek", correo: "derek@tiendademo.com", rol: "cliente", verificado: true, creado: new Date("2026-09-03") };

function armar() {
  const servicio = {
    perfil: jest.fn().mockResolvedValue(PERFIL),
    renombrar: jest.fn().mockResolvedValue({ ...PERFIL, nombre: "Derek Calderón" }),
    cambiarContrasena: jest.fn().mockResolvedValue(undefined),
    cerrarTodas: jest.fn().mockResolvedValue(undefined),
  };
  return { controller: new CuentaController(servicio as unknown as CuentaService, LOCAL), servicio };
}

function respuestaDe(error: Error) {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = { switchToHttp: () => ({ getResponse: () => ({ status }) }) } as unknown as ArgumentsHost;
  new ErroresIdentidadFilter().catch(error, host);
  return { status, json };
}

describe("CuentaController (M1-06, M1-07)", () => {
  it("todas las rutas exigen sesión: el controlador lleva SesionGuard", () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, CuentaController)).toEqual([SesionGuard]);
  });

  it("sin cookie, SesionGuard responde 401 SinSesion antes de llegar a Mi cuenta", async () => {
    const sesiones = { usuarioDe: jest.fn() } as unknown as SesionService;
    const contexto = { switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }) } as unknown as ExecutionContext;

    const error = await new SesionGuard(sesiones).canActivate(contexto).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect((error as UnauthorizedException).getResponse()).toEqual({ codigo: "SinSesion", mensaje: "Inicia sesión para continuar." });
    expect(sesiones.usuarioDe).not.toHaveBeenCalled();
  });

  it("GET /identidad/cuenta devuelve el perfil de la sesión", async () => {
    const { controller, servicio } = armar();

    await expect(controller.perfil("u-1")).resolves.toEqual(PERFIL);
    expect(servicio.perfil).toHaveBeenCalledWith("u-1");
  });

  it("PATCH /identidad/cuenta pasa el nombre tal cual; sin nombre llega vacío y el dominio lo rechaza", async () => {
    const { controller, servicio } = armar();

    await controller.renombrar("u-1", { nombre: "  Derek Calderón  " });
    await controller.renombrar("u-1", {});

    expect(servicio.renombrar).toHaveBeenNthCalledWith(1, "u-1", "  Derek Calderón  ");
    expect(servicio.renombrar).toHaveBeenNthCalledWith(2, "u-1", "");
  });

  it("POST /identidad/cuenta/contrasena responde 204 y usa la sesión de la cookie como la que sigue viva", async () => {
    const { controller, servicio } = armar();
    const solicitud = { headers: { cookie: `${COOKIE_SESION}=token-actual` } } as unknown as Request;

    await controller.cambiarContrasena("u-1", { actual: "Vieja#Clave2026", nueva: "Nueva#Clave2026" }, solicitud);

    expect(Reflect.getMetadata(HTTP_CODE_METADATA, CuentaController.prototype.cambiarContrasena)).toBe(204);
    expect(servicio.cambiarContrasena).toHaveBeenCalledWith("u-1", "token-actual", { actual: "Vieja#Clave2026", nueva: "Nueva#Clave2026" });
  });

  it("DELETE /identidad/sesiones revoca todas y vence la cookie (204)", async () => {
    const { controller, servicio } = armar();
    const respuesta = { setHeader: jest.fn() } as unknown as Response;

    await controller.cerrarTodas("u-1", respuesta);

    expect(Reflect.getMetadata(HTTP_CODE_METADATA, CuentaController.prototype.cerrarTodas)).toBe(204);
    expect(servicio.cerrarTodas).toHaveBeenCalledWith("u-1");
    expect(respuesta.setHeader).toHaveBeenCalledWith("Set-Cookie", cookieSesionVencida(LOCAL));
  });

  it("el filtro traduce NombreInvalido y ContrasenaActualIncorrecta a 400, y una cuenta inexistente a 401 SinSesion", () => {
    const nombre = respuestaDe(new NombreInvalido(64));
    expect(nombre.status).toHaveBeenCalledWith(400);
    expect(nombre.json).toHaveBeenCalledWith(expect.objectContaining({ codigo: "NombreInvalido" }));

    const actual = respuestaDe(new ContrasenaActualIncorrecta());
    expect(actual.status).toHaveBeenCalledWith(400);
    expect(actual.json).toHaveBeenCalledWith(expect.objectContaining({ codigo: "ContrasenaActualIncorrecta" }));

    const repetida = respuestaDe(new ContrasenaRepetida());
    expect(repetida.status).toHaveBeenCalledWith(400);
    expect(repetida.json).toHaveBeenCalledWith(expect.objectContaining({ codigo: "ContrasenaRepetida" }));

    const inexistente = respuestaDe(new CuentaInexistente("u-1"));
    expect(inexistente.status).toHaveBeenCalledWith(401);
    expect(inexistente.json).toHaveBeenCalledWith(expect.objectContaining({ codigo: "SinSesion" }));
  });
});
