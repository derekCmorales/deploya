import { UnauthorizedException, type ArgumentsHost, type ExecutionContext } from "@nestjs/common";
import type { Request, Response } from "express";
import { COOKIE_SESION, configuracionCookieDesde, cookieSesion, cookieSesionVencida, leerCookie } from "./cookie-sesion";
import { CredencialesInvalidas, CuentaNoVerificada, CuentaSuspendida } from "./dominio/errores";
import type { UsuarioSesion } from "./dominio/sesion";
import { ErroresIdentidadFilter } from "./identidad.controller";
import { SesionController } from "./sesion.controller";
import { SesionGuard, type SolicitudConSesion } from "./sesion.guard";
import type { SesionService } from "./sesion.service";
import { usuarioActualDe } from "./usuario-actual.decorator";

const USUARIO: UsuarioSesion = { id: "u-1", correo: "derek@tiendademo.com", nombre: "Derek", rol: "cliente" };
const LOCAL = { segura: false };

function servicioFalso() {
  return {
    iniciar: jest.fn().mockResolvedValue({ token: "tok en=1", usuario: USUARIO }),
    cerrar: jest.fn().mockResolvedValue(undefined),
    usuarioDe: jest.fn(async (token: string) => (token === "valido" ? USUARIO : null)),
  };
}

function respuestaFalsa() {
  return { setHeader: jest.fn() } as unknown as Response & { setHeader: jest.Mock };
}

function contextoCon(solicitud: SolicitudConSesion): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => solicitud }) } as unknown as ExecutionContext;
}

describe("Cookie de sesión", () => {
  it("HttpOnly, SameSite=Lax, 7 días; Secure solo si la web va por HTTPS", () => {
    expect(cookieSesion("abc", LOCAL)).toBe(`${COOKIE_SESION}=abc; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
    expect(cookieSesion("abc", configuracionCookieDesde({ URL_WEB: "https://deploya.app" }))).toMatch(/; Secure$/);
    expect(configuracionCookieDesde({ URL_WEB: "http://localhost:3000" })).toEqual(LOCAL);
    expect(cookieSesionVencida(LOCAL)).toContain("Max-Age=0");
  });

  it("lee la cookie de sesión entre otras y decodifica su valor", () => {
    expect(leerCookie(`tema=oscuro; ${COOKIE_SESION}=a%3Db; otra=1`, COOKIE_SESION)).toBe("a=b");
    expect(leerCookie("tema=oscuro", COOKIE_SESION)).toBeNull();
    expect(leerCookie(undefined, COOKIE_SESION)).toBeNull();
  });
});

describe("SesionGuard y @UsuarioActual()", () => {
  it("Ruta protegida sin sesión: sin cookie responde 401", async () => {
    const guard = new SesionGuard(servicioFalso() as unknown as SesionService);

    await expect(guard.canActivate(contextoCon({ headers: {} }))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("Ruta protegida con una cookie que ya no vale responde 401", async () => {
    const guard = new SesionGuard(servicioFalso() as unknown as SesionService);

    await expect(guard.canActivate(contextoCon({ headers: { cookie: `${COOKIE_SESION}=vencido` } }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("Con sesión vigente deja el usuario en la solicitud para @UsuarioActual()", async () => {
    const guard = new SesionGuard(servicioFalso() as unknown as SesionService);
    const solicitud: SolicitudConSesion = { headers: { cookie: `${COOKIE_SESION}=valido` } };

    await expect(guard.canActivate(contextoCon(solicitud))).resolves.toBe(true);

    expect(usuarioActualDe(solicitud)).toEqual(USUARIO);
    expect(usuarioActualDe(solicitud, "id")).toBe("u-1");
  });

  it("@UsuarioActual() sin guard previo responde 401", () => {
    expect(() => usuarioActualDe({ headers: {} })).toThrow(UnauthorizedException);
  });
});

describe("SesionController", () => {
  it("POST /identidad/sesion pone la cookie y responde solo el usuario", async () => {
    const servicio = servicioFalso();
    const controlador = new SesionController(servicio as unknown as SesionService, LOCAL);
    const respuesta = respuestaFalsa();
    const solicitud = { headers: { "user-agent": "jest" } } as unknown as Request;

    const cuerpo = await controlador.iniciar({ correo: "derek@tiendademo.com", contrasena: "x" }, solicitud, respuesta);

    expect(cuerpo).toEqual({ usuario: USUARIO });
    expect(servicio.iniciar).toHaveBeenCalledWith({ correo: "derek@tiendademo.com", contrasena: "x", agenteUsuario: "jest" });
    expect(respuesta.setHeader).toHaveBeenCalledWith("Set-Cookie", cookieSesion("tok en=1", LOCAL));
  });

  it("GET /identidad/sesion devuelve el usuario de la sesión", () => {
    const controlador = new SesionController(servicioFalso() as unknown as SesionService, LOCAL);
    expect(controlador.actual(USUARIO)).toEqual({ usuario: USUARIO });
  });

  it("DELETE /identidad/sesion revoca la sesión y vence la cookie", async () => {
    const servicio = servicioFalso();
    const controlador = new SesionController(servicio as unknown as SesionService, LOCAL);
    const respuesta = respuestaFalsa();

    await controlador.cerrar({ headers: { cookie: `${COOKIE_SESION}=valido` } } as unknown as Request, respuesta);
    await controlador.cerrar({ headers: {} } as unknown as Request, respuesta);

    expect(servicio.cerrar).toHaveBeenCalledTimes(1);
    expect(servicio.cerrar).toHaveBeenCalledWith("valido");
    expect(respuesta.setHeader).toHaveBeenLastCalledWith("Set-Cookie", cookieSesionVencida(LOCAL));
  });

  it.each([
    [new CredencialesInvalidas(), 401, { codigo: "CredencialesInvalidas" }],
    [new CuentaNoVerificada("d•••k@t•••••••o.com"), 403, { codigo: "CuentaNoVerificada", correoEnmascarado: "d•••k@t•••••••o.com" }],
    [new CuentaSuspendida(), 403, { codigo: "CuentaSuspendida", motivo: null, desde: null }],
    [
      new CuentaSuspendida("Uso que incumple los términos (§7.2).", new Date("2026-09-22T15:00:00.000Z")),
      403,
      { codigo: "CuentaSuspendida", motivo: "Uso que incumple los términos (§7.2).", desde: "2026-09-22T15:00:00.000Z" },
    ],
  ])("el filtro traduce %p a HTTP %i", (error, estado, cuerpo) => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const host = { switchToHttp: () => ({ getResponse: () => ({ status }) }) } as unknown as ArgumentsHost;

    new ErroresIdentidadFilter().catch(error, host);

    expect(status).toHaveBeenCalledWith(estado);
    expect(json).toHaveBeenCalledWith(expect.objectContaining(cuerpo));
  });
});
